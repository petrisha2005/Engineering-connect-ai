import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { Profile } from "../models/Profile.js";
import { Project } from "../models/Project.js";
import { User } from "../models/User.js";

interface SeedProfile {
  firebaseUid: string;
  email: string;
  displayName: string;
  name: string;
  college: string;
  branch: string;
  year: number;
  skills: string[];
  interests: string[];
  goals: string[];
  github: string;
  linkedin: string;
  achievements: string[];
  headline: string;
  bio: string;
  location: string;
  projects: Array<{
    title: string;
    description: string;
    skills: string[];
    links: string[];
  }>;
}

const profiles: SeedProfile[] = [
  {
    firebaseUid: "seed:aarav-sharma",
    email: "aarav.sharma@seed.engineerconnect.ai",
    displayName: "Aarav Sharma",
    name: "Aarav Sharma",
    college: "Indian Institute of Technology Bombay",
    branch: "Computer Science and Engineering",
    year: 3,
    skills: ["react", "typescript", "node.js", "mongodb", "machine learning", "python"],
    interests: ["ai products", "hackathons", "developer tools", "open source"],
    goals: ["full stack engineer", "ai startup founder", "build scalable products"],
    github: "https://github.com/aarav-sharma-placeholder",
    linkedin: "https://www.linkedin.com/in/aarav-sharma-placeholder",
    achievements: ["Smart India Hackathon finalist", "Maintains a campus open-source utilities repo"],
    headline: "Full-stack builder focused on AI collaboration tools",
    bio: "Aarav enjoys shipping practical AI tools with clean product experiences and reliable backend systems.",
    location: "Mumbai, India",
    projects: [
      {
        title: "Campus Copilot",
        description: "An AI assistant that answers college club, event, and placement questions from verified documents.",
        skills: ["react", "node.js", "mongodb", "machine learning"],
        links: ["https://github.com/aarav-sharma-placeholder/campus-copilot"]
      }
    ]
  },
  {
    firebaseUid: "seed:meera-iyer",
    email: "meera.iyer@seed.engineerconnect.ai",
    displayName: "Meera Iyer",
    name: "Meera Iyer",
    college: "National Institute of Technology Tiruchirappalli",
    branch: "Electronics and Communication Engineering",
    year: 2,
    skills: ["embedded systems", "iot", "c++", "python", "pcb design", "signal processing"],
    interests: ["wearables", "smart cities", "research collaboration", "hardware startups"],
    goals: ["iot engineer", "research collaborator", "hardware product builder"],
    github: "https://github.com/meera-iyer-placeholder",
    linkedin: "https://www.linkedin.com/in/meera-iyer-placeholder",
    achievements: ["Built a low-cost air quality sensor network", "Published a campus technical poster on LoRa telemetry"],
    headline: "ECE student building IoT systems for real-world sensing",
    bio: "Meera works across firmware, sensors, and data pipelines for hardware-first engineering projects.",
    location: "Tiruchirappalli, India",
    projects: [
      {
        title: "LoRa Air Grid",
        description: "A distributed air quality monitoring grid using LoRa nodes and a realtime dashboard.",
        skills: ["embedded systems", "iot", "c++", "python"],
        links: ["https://github.com/meera-iyer-placeholder/lora-air-grid"]
      }
    ]
  },
  {
    firebaseUid: "seed:kabir-khan",
    email: "kabir.khan@seed.engineerconnect.ai",
    displayName: "Kabir Khan",
    name: "Kabir Khan",
    college: "BITS Pilani",
    branch: "Mechanical Engineering",
    year: 4,
    skills: ["cad", "solidworks", "robotics", "python", "control systems", "3d printing"],
    interests: ["robotics", "autonomous systems", "startup cofounders", "product design"],
    goals: ["robotics engineer", "hardware startup founder", "mechatronics specialist"],
    github: "https://github.com/kabir-khan-placeholder",
    linkedin: "https://www.linkedin.com/in/kabir-khan-placeholder",
    achievements: ["Led university rover drivetrain design", "Won best mechanical design at a robotics expo"],
    headline: "Mechanical engineer turning prototypes into robust robots",
    bio: "Kabir blends CAD, controls, and rapid prototyping to build reliable robotic platforms.",
    location: "Pilani, India",
    projects: [
      {
        title: "Autonomous Rover Drivetrain",
        description: "A modular rover drivetrain optimized for uneven outdoor terrain and quick repairs.",
        skills: ["cad", "solidworks", "robotics", "control systems"],
        links: ["https://github.com/kabir-khan-placeholder/rover-drivetrain"]
      }
    ]
  },
  {
    firebaseUid: "seed:ananya-rao",
    email: "ananya.rao@seed.engineerconnect.ai",
    displayName: "Ananya Rao",
    name: "Ananya Rao",
    college: "Vellore Institute of Technology",
    branch: "Information Technology",
    year: 3,
    skills: ["java", "spring boot", "postgresql", "docker", "aws", "system design"],
    interests: ["cloud platforms", "backend systems", "mentorship", "career roadmaps"],
    goals: ["backend engineer", "cloud architect", "technical mentor"],
    github: "https://github.com/ananya-rao-placeholder",
    linkedin: "https://www.linkedin.com/in/ananya-rao-placeholder",
    achievements: ["AWS Cloud Club project lead", "Top 5 in a backend API design challenge"],
    headline: "Backend engineer focused on cloud-native student products",
    bio: "Ananya likes designing reliable APIs, database schemas, and deployment pipelines for high-traffic apps.",
    location: "Vellore, India",
    projects: [
      {
        title: "Placement Tracker API",
        description: "A secure backend for tracking placement applications, interview rounds, and preparation tasks.",
        skills: ["java", "spring boot", "postgresql", "docker"],
        links: ["https://github.com/ananya-rao-placeholder/placement-tracker-api"]
      }
    ]
  },
  {
    firebaseUid: "seed:rohan-menon",
    email: "rohan.menon@seed.engineerconnect.ai",
    displayName: "Rohan Menon",
    name: "Rohan Menon",
    college: "SRM Institute of Science and Technology",
    branch: "Computer Science and Engineering",
    year: 2,
    skills: ["flutter", "firebase", "dart", "ui design", "figma", "rest apis"],
    interests: ["mobile apps", "student communities", "hackathons", "social impact"],
    goals: ["mobile app developer", "product engineer", "community platform builder"],
    github: "https://github.com/rohan-menon-placeholder",
    linkedin: "https://www.linkedin.com/in/rohan-menon-placeholder",
    achievements: ["Built a student club discovery app", "Won best UI at a campus hackathon"],
    headline: "Mobile-first product engineer building student community apps",
    bio: "Rohan designs and builds mobile experiences that help students coordinate, discover events, and collaborate.",
    location: "Chennai, India",
    projects: [
      {
        title: "ClubConnect Mobile",
        description: "A Flutter app for discovering student clubs, events, and volunteer opportunities.",
        skills: ["flutter", "firebase", "dart", "ui design"],
        links: ["https://github.com/rohan-menon-placeholder/clubconnect-mobile"]
      }
    ]
  },
  {
    firebaseUid: "seed:nisha-verma",
    email: "nisha.verma@seed.engineerconnect.ai",
    displayName: "Nisha Verma",
    name: "Nisha Verma",
    college: "Delhi Technological University",
    branch: "Artificial Intelligence and Data Science",
    year: 3,
    skills: ["python", "pytorch", "nlp", "data analysis", "fastapi", "vector databases"],
    interests: ["llms", "research collaboration", "career coaching", "edtech"],
    goals: ["machine learning engineer", "ai researcher", "build ai career tools"],
    github: "https://github.com/nisha-verma-placeholder",
    linkedin: "https://www.linkedin.com/in/nisha-verma-placeholder",
    achievements: ["Published an NLP survey with faculty mentor", "Built a semantic search demo for research papers"],
    headline: "AI student working on NLP and career guidance systems",
    bio: "Nisha builds NLP pipelines and evaluation workflows for education and student productivity products.",
    location: "Delhi, India",
    projects: [
      {
        title: "Research Paper Semantic Search",
        description: "A vector-search app that helps students discover related papers and research collaborators.",
        skills: ["python", "nlp", "fastapi", "vector databases"],
        links: ["https://github.com/nisha-verma-placeholder/paper-semantic-search"]
      }
    ]
  },
  {
    firebaseUid: "seed:aditya-sen",
    email: "aditya.sen@seed.engineerconnect.ai",
    displayName: "Aditya Sen",
    name: "Aditya Sen",
    college: "Jadavpur University",
    branch: "Electrical Engineering",
    year: 4,
    skills: ["power electronics", "matlab", "simulink", "renewable energy", "python", "data visualization"],
    interests: ["clean energy", "research collaboration", "sustainability", "smart grids"],
    goals: ["energy systems engineer", "renewable energy researcher", "climate tech founder"],
    github: "https://github.com/aditya-sen-placeholder",
    linkedin: "https://www.linkedin.com/in/aditya-sen-placeholder",
    achievements: ["Modeled a solar microgrid for rural campuses", "Presented at a student energy symposium"],
    headline: "Electrical engineer focused on renewable energy systems",
    bio: "Aditya models energy systems and builds dashboards for monitoring renewable generation and load behavior.",
    location: "Kolkata, India",
    projects: [
      {
        title: "Solar Microgrid Simulator",
        description: "A simulator for analyzing solar generation, battery sizing, and campus load profiles.",
        skills: ["matlab", "simulink", "renewable energy", "python"],
        links: ["https://github.com/aditya-sen-placeholder/solar-microgrid"]
      }
    ]
  },
  {
    firebaseUid: "seed:priya-nair",
    email: "priya.nair@seed.engineerconnect.ai",
    displayName: "Priya Nair",
    name: "Priya Nair",
    college: "Amrita Vishwa Vidyapeetham",
    branch: "Cyber Security",
    year: 3,
    skills: ["network security", "linux", "python", "web security", "ctf", "cloud security"],
    interests: ["security research", "open source", "mentorship", "secure startups"],
    goals: ["security engineer", "cloud security specialist", "security researcher"],
    github: "https://github.com/priya-nair-placeholder",
    linkedin: "https://www.linkedin.com/in/priya-nair-placeholder",
    achievements: ["Top 10 in a national CTF qualifier", "Reported responsible disclosure issues in student apps"],
    headline: "Cybersecurity student helping teams build safer products",
    bio: "Priya enjoys threat modeling, secure API reviews, and practical cloud security for early-stage projects.",
    location: "Coimbatore, India",
    projects: [
      {
        title: "Student App Security Checklist",
        description: "A practical checklist and scanner for common web security issues in student-built apps.",
        skills: ["web security", "python", "linux", "cloud security"],
        links: ["https://github.com/priya-nair-placeholder/security-checklist"]
      }
    ]
  },
  {
    firebaseUid: "seed:siddharth-jain",
    email: "siddharth.jain@seed.engineerconnect.ai",
    displayName: "Siddharth Jain",
    name: "Siddharth Jain",
    college: "Manipal Institute of Technology",
    branch: "Computer and Communication Engineering",
    year: 2,
    skills: ["next.js", "react", "tailwind css", "graphql", "mongodb", "product analytics"],
    interests: ["saas products", "startup cofounders", "developer communities", "design systems"],
    goals: ["frontend engineer", "saas founder", "growth-minded product engineer"],
    github: "https://github.com/siddharth-jain-placeholder",
    linkedin: "https://www.linkedin.com/in/siddharth-jain-placeholder",
    achievements: ["Launched a campus SaaS waitlist product", "Organized a design systems workshop"],
    headline: "Frontend and SaaS builder with a product analytics mindset",
    bio: "Siddharth builds polished web apps and cares deeply about onboarding, metrics, and fast iteration.",
    location: "Manipal, India",
    projects: [
      {
        title: "Campus SaaS Starter",
        description: "A template for student founders to launch landing pages, waitlists, and private betas quickly.",
        skills: ["next.js", "react", "tailwind css", "product analytics"],
        links: ["https://github.com/siddharth-jain-placeholder/campus-saas-starter"]
      }
    ]
  },
  {
    firebaseUid: "seed:tanya-das",
    email: "tanya.das@seed.engineerconnect.ai",
    displayName: "Tanya Das",
    name: "Tanya Das",
    college: "PES University",
    branch: "Biotechnology Engineering",
    year: 3,
    skills: ["bioinformatics", "python", "r", "data visualization", "statistics", "research writing"],
    interests: ["health tech", "research collaboration", "ai in biology", "data science"],
    goals: ["bioinformatics researcher", "health tech product builder", "data scientist"],
    github: "https://github.com/tanya-das-placeholder",
    linkedin: "https://www.linkedin.com/in/tanya-das-placeholder",
    achievements: ["Built a gene expression visualization notebook", "Assisted a faculty-led health data project"],
    headline: "Biotech engineer applying data science to health research",
    bio: "Tanya bridges biology, statistics, and software to make research data easier to explore and explain.",
    location: "Bengaluru, India",
    projects: [
      {
        title: "Gene Expression Explorer",
        description: "A notebook-driven dashboard for exploring gene expression patterns across sample groups.",
        skills: ["bioinformatics", "python", "r", "data visualization"],
        links: ["https://github.com/tanya-das-placeholder/gene-expression-explorer"]
      }
    ]
  }
];

const projectSeeds = [
  {
    ownerEmail: "aarav.sharma@seed.engineerconnect.ai",
    title: "AI Mentor Match",
    description:
      "Build an AI-assisted mentor matching workflow that recommends senior students and alumni based on skills, goals, and project history.",
    requiredSkills: ["react", "typescript", "node.js", "mongodb", "machine learning"],
    interests: ["ai products", "career coaching", "student communities"],
    maxMembers: 5,
    repositoryUrl: "https://github.com/aarav-sharma-placeholder/ai-mentor-match"
  },
  {
    ownerEmail: "meera.iyer@seed.engineerconnect.ai",
    title: "Smart Lab Occupancy Tracker",
    description:
      "Create an IoT system that tracks lab occupancy, equipment status, and usage trends for better shared workspace planning.",
    requiredSkills: ["iot", "embedded systems", "python", "data visualization"],
    interests: ["smart cities", "hardware startups", "student communities"],
    maxMembers: 4,
    repositoryUrl: "https://github.com/meera-iyer-placeholder/smart-lab-tracker"
  },
  {
    ownerEmail: "nisha.verma@seed.engineerconnect.ai",
    title: "Career Roadmap Evaluator",
    description:
      "Design an AI workflow that reviews a student's career roadmap, identifies missing skills, and suggests practical projects.",
    requiredSkills: ["python", "nlp", "fastapi", "vector databases"],
    interests: ["llms", "career coaching", "edtech"],
    maxMembers: 5,
    repositoryUrl: "https://github.com/nisha-verma-placeholder/roadmap-evaluator"
  },
  {
    ownerEmail: "kabir.khan@seed.engineerconnect.ai",
    title: "Campus Delivery Robot Prototype",
    description:
      "Prototype a small autonomous delivery robot for campus routes with mechanical design, controls, and a simple operator dashboard.",
    requiredSkills: ["robotics", "cad", "control systems", "3d printing", "python"],
    interests: ["autonomous systems", "product design", "startup cofounders"],
    maxMembers: 6,
    repositoryUrl: "https://github.com/kabir-khan-placeholder/campus-delivery-robot"
  },
  {
    ownerEmail: "priya.nair@seed.engineerconnect.ai",
    title: "Secure Hackathon Starter Kit",
    description:
      "Create reusable auth, validation, rate limiting, and deployment templates so hackathon teams can ship safer MVPs.",
    requiredSkills: ["web security", "cloud security", "node.js", "react"],
    interests: ["security research", "hackathons", "open source"],
    maxMembers: 4,
    repositoryUrl: "https://github.com/priya-nair-placeholder/secure-hackathon-starter"
  }
];

async function upsertSeedProfile(seed: SeedProfile) {
  let user = await User.findOne({ firebaseUid: seed.firebaseUid });

  if (!user) {
    user = await User.create({
      firebaseUid: seed.firebaseUid,
      email: seed.email,
      displayName: seed.displayName,
      role: "student",
      lastLoginAt: new Date()
    });
  } else {
    user.displayName = seed.displayName;
    user.lastLoginAt = new Date();
    await user.save();
  }

  const profile = await Profile.findOneAndUpdate(
    { user: user._id },
    {
      user: user._id,
      name: seed.name,
      college: seed.college,
      branch: seed.branch,
      year: seed.year,
      skills: seed.skills,
      interests: seed.interests,
      goals: seed.goals,
      projects: seed.projects,
      github: seed.github,
      linkedin: seed.linkedin,
      achievements: seed.achievements,
      availability: "open",
      headline: seed.headline,
      bio: seed.bio,
      location: seed.location
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  if (!user.profile || !user.profile.equals(profile._id)) {
    user.profile = profile._id;
    await user.save();
  }

  return user;
}

async function seedProjects() {
  let created = 0;
  let skipped = 0;

  for (const seed of projectSeeds) {
    const owner = await User.findOne({ email: seed.ownerEmail });

    if (!owner) {
      skipped += 1;
      continue;
    }

    const existingProject = await Project.findOne({ owner: owner._id, title: seed.title });

    if (existingProject) {
      skipped += 1;
      continue;
    }

    await Project.create({
      owner: owner._id,
      title: seed.title,
      description: seed.description,
      requiredSkills: seed.requiredSkills,
      interests: seed.interests,
      status: "open",
      maxMembers: seed.maxMembers,
      repositoryUrl: seed.repositoryUrl,
      members: [{ user: owner._id, role: "Owner" }]
    });
    created += 1;
  }

  return { created, skipped };
}

async function seed() {
  await connectDatabase();
  await Profile.collection.dropIndex("skills_1_interests_1_goals_1").catch((error: { codeName?: string }) => {
    if (error.codeName !== "IndexNotFound") {
      throw error;
    }
  });

  let profileCount = 0;

  for (const profile of profiles) {
    await upsertSeedProfile(profile);
    profileCount += 1;
  }

  const projectResult = await seedProjects();

  console.log(`Seed complete: upserted ${profileCount} profiles, created ${projectResult.created} projects, skipped ${projectResult.skipped} projects.`);
}

seed()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
