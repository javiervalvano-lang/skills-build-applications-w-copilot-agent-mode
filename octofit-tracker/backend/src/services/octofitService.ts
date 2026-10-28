import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function ensureValidObjectId(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !mongoose.Types.ObjectId.isValid(value)) {
    throw Object.assign(new Error(`Invalid ${fieldName} ID`), { status: 400 });
  }
  return value;
}

function toNumber(value: unknown, fieldName: string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw Object.assign(new Error(`Invalid ${fieldName}`), { status: 400 });
  }
  return number;
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Activity payload is required'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  const userObjectId = ensureValidObjectId(userId, 'user');
  const teamObjectId = ensureValidObjectId(teamId, 'team');
  const activityType = typeof type === 'string' ? type.trim() : '';
  const activityMinutes = toNumber(minutes, 'minutes');

  if (!activityType) {
    throw Object.assign(new Error('Activity type is required'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.findById(userObjectId),
    Team.findById(teamObjectId),
  ]);

  if (!user || !team) {
    throw Object.assign(new Error('User and team must exist for the activity'), { status: 404 });
  }

  const occurredAt = new Date();
  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: activityType,
    minutes: activityMinutes,
    points: Math.max(1, Math.round(activityMinutes)),
    occurredAt,
  });

  return {
    _id: activity._id.toString(),
    user: activity.user.toString(),
    team: activity.team.toString(),
    type: activity.type,
    minutes: activity.minutes,
    points: activity.points,
    occurredAt: activity.occurredAt.toISOString(),
  };
}

export async function listTeams() {
  const teams = await Team.find().lean();
  return teams.map((team) => ({
    ...team,
    _id: team._id.toString(),
    members: (team.members ?? []).map((member) => {
      if (member instanceof mongoose.Types.ObjectId) return member.toString();
      return typeof member === 'string' ? member : String(member);
    }),
  }));
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Team payload is required'), { status: 400 });
  }

  const { name, mascot, members } = input as Record<string, unknown>;
  const teamName = typeof name === 'string' ? name.trim() : '';
  const teamMascot = typeof mascot === 'string' ? mascot.trim() : '';

  if (!teamName) {
    throw Object.assign(new Error('Team name is required'), { status: 400 });
  }
  if (!teamMascot) {
    throw Object.assign(new Error('Team mascot is required'), { status: 400 });
  }

  const memberIds = Array.isArray(members) ? members.map((member) => String(member)) : [];
  const validMembers = memberIds.filter((member) => mongoose.Types.ObjectId.isValid(member));

  const team = await Team.create({
    name: teamName,
    mascot: teamMascot,
    members: validMembers,
  });

  return {
    _id: team._id.toString(),
    name: team.name,
    mascot: team.mascot,
    members: team.members.map((member) => member.toString()),
  };
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);

  const leaderboard = await Promise.all(
    totals.map(async (entry, index) => {
      const team = await Team.findById(entry._id).lean();
      return {
        teamName: team?.name ?? 'Unknown team',
        totalPoints: Number(entry.totalPoints),
        rank: index + 1,
      };
    }),
  );

  return leaderboard;
}

export async function suggestWorkouts(userEmail: string) {
  const email = normalizeEmail(userEmail);
  const user = await User.findOne({ email }).lean();

  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const recentType = recentActivities[0]?.type ?? '';
  const goal = typeof user.fitnessGoal === 'string' ? user.fitnessGoal.trim().toLowerCase() : '';
  const workouts = await Workout.find().lean();

  const ranked = [...workouts].sort((left, right) => {
    const leftScore = Number(left.focus === goal || left.focus === recentType) + Number(left.focus === goal) * 2;
    const rightScore = Number(right.focus === goal || right.focus === recentType) + Number(right.focus === goal) * 2;
    return rightScore - leftScore;
  });

  const suggestions = ranked.map((workout) => {
    const focus = typeof workout.focus === 'string' ? workout.focus.toLowerCase() : '';
    let reason = 'Matches your recent activity pattern.';

    if (goal && focus === goal) {
      reason = recentType
        ? `Based on your recent ${recentType} activity and ${goal} goal, this workout matches your pattern.`
        : `Matches your ${goal} goal.`;
    } else if (recentType && focus === recentType.toLowerCase()) {
      reason = `Matches your recent ${recentType} activity.`;
    }

    return {
      _id: workout._id.toString(),
      title: workout.title,
      focus: workout.focus,
      minutes: workout.minutes,
      difficulty: workout.difficulty,
      reason,
    };
  });

  return suggestions;
}

export { User };
