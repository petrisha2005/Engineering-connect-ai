# Database Design

All collections use Mongoose timestamps and MongoDB Atlas indexes.

## User

Stores the application identity associated with Firebase Authentication.

Fields:

- `firebaseUid` unique required string
- `email` unique required lowercase string
- `displayName` required string
- `photoURL` optional string
- `role` enum: `student`, `admin`
- `lastLoginAt` date
- `profile` ObjectId ref `Profile`

Indexes:

- unique `firebaseUid`
- unique `email`

## Profile

Stores student networking and career information.

Fields:

- `user` unique ObjectId ref `User`
- `name`, `college`, `branch`, `year`
- `skills[]`, `interests[]`, `goals[]`
- `projects[]`: title, description, links, skills
- `github`, `linkedin`
- `achievements[]`
- `availability` enum: `open`, `selective`, `unavailable`
- `headline`, `bio`, `location`
- `embeddingText` generated text used for matching

Indexes:

- text index on name, college, branch, skills, interests, goals
- compound indexes on skills/interests/goals
- unique `user`

## Project

Stores marketplace projects.

Fields:

- `owner` ObjectId ref `User`
- `title`, `description`
- `requiredSkills[]`, `interests[]`
- `status` enum: `open`, `in_progress`, `completed`, `archived`
- `members[]`: user, role, joinedAt
- `invites[]`: user, invitedBy, status, invitedAt
- `maxMembers`
- `repositoryUrl`, `demoUrl`

Indexes:

- text index on title, description, skills, interests
- `owner`
- `status`

## Application

Stores project and hackathon join applications.

Fields:

- `applicant` ObjectId ref `User`
- `targetType` enum: `project`, `hackathon_team`
- `project` optional ObjectId ref `Project`
- `hackathonTeam` optional ObjectId ref `HackathonTeam`
- `message`
- `rolePreference`
- `status` enum: `pending`, `accepted`, `rejected`, `withdrawn`
- `decidedBy`, `decidedAt`

Indexes:

- compound applicant plus target
- target status

## HackathonTeam

Stores hackathon teams and role requirements.

Fields:

- `owner` ObjectId ref `User`
- `name`, `hackathonName`, `description`
- `requiredRoles[]`: role, skills, filledBy
- `members[]`: user, role, joinedAt
- `skillsNeeded[]`
- `status` enum: `forming`, `ready`, `competing`, `archived`
- `maxMembers`
- `lookingFor`

Indexes:

- text index on name, hackathonName, description, skillsNeeded
- status
- owner

## Match

Stores generated compatibility snapshots between students.

Fields:

- `sourceUser` ObjectId ref `User`
- `targetUser` ObjectId ref `User`
- `matchScore` number 0-100
- `compatibilityScore` number 0-100
- `reasons[]`
- `sharedSkills[]`, `sharedInterests[]`, `sharedGoals[]`
- `generatedBy` enum: `algorithm`, `ai`

Indexes:

- unique source-target pair
- descending score indexes for recommendations

## Roadmap

Stores Gemini-generated career roadmaps.

Fields:

- `user` ObjectId ref `User`
- `desiredCareer`
- `skills[]`
- `projects[]`
- `certifications[]`
- `learningPath[]`: title, description, duration, resources
- `interviewPreparation[]`
- `rawAiResponse`
- `model`

Indexes:

- `user`
- `desiredCareer`

## Notification

Stores user notifications and read state.

Fields:

- `user` ObjectId ref `User`
- `type`
- `title`
- `body`
- `link`
- `readAt`
- `metadata`
- `priority` enum: `low`, `normal`, `high`

Indexes:

- user plus createdAt descending
- unread notifications
