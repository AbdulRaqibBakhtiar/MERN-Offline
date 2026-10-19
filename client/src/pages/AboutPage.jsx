import React from 'react';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl } from '../utils/avatar';
import {
  BookOpen,
  Braces,
  Camera,
  Database,
  FileText,
  LockKeyhole,
  MessageCircle,
  Radio,
  Server,
  ShoppingBag,
  UsersRound,
  Zap
} from 'lucide-react';

// Swap these demo values for your own details when you're ready to publish.
const creatorProfile = {
  name: 'Your Name',
  role: 'Computer Science Graduate · Full-Stack Developer',
  location: 'Your City, Country',
  photo: '',
  introduction: 'I enjoy turning practical problems into thoughtful web experiences. Bazzar is my portfolio project exploring how a community, a marketplace, and useful publishing tools can work together.'
};

const technologyGroups = [
  {
    title: 'Frontend',
    Icon: Braces,
    technologies: ['React', 'JavaScript', 'React Router', 'Axios', 'CSS']
  },
  {
    title: 'Backend',
    Icon: Server,
    technologies: ['Node.js', 'Express', 'REST APIs']
  },
  {
    title: 'Data & security',
    Icon: Database,
    technologies: ['MongoDB', 'Mongoose', 'JWT', 'bcrypt']
  },
  {
    title: 'Real-time & media',
    Icon: Radio,
    technologies: ['Socket.IO', 'Multer', 'Image & video uploads']
  }
];

const projectHighlights = [
  {
    Icon: ShoppingBag,
    title: 'Community marketplace',
    text: 'Browse and search product listings, view seller details, save favorites, ask questions, and send order requests.'
  },
  {
    Icon: MessageCircle,
    title: 'Live chat with Socket.IO',
    text: 'Real-time conversations connect people around the community and marketplace, with rooms for direct and group chats.'
  },
  {
    Icon: BookOpen,
    title: 'Editorial publishing',
    text: 'Articles support rich content blocks, images, video, links, comments, replies, and a publishing workflow.'
  },
  {
    Icon: UsersRound,
    title: 'Community & profiles',
    text: 'Member profiles and community updates bring a social layer alongside listings and articles.'
  },
  {
    Icon: LockKeyhole,
    title: 'Accounts & permissions',
    text: 'Authentication and role-aware experiences provide a foundation for members, editors, and administrators.'
  },
  {
    Icon: Zap,
    title: 'Responsive experience',
    text: 'Search, dark mode, media previews, notifications, and responsive layouts help the platform feel cohesive across screens.'
  }
];

const AboutPage = () => {
  const { user } = useAuth();
  const profileName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || creatorProfile.name;
  const builderName = creatorProfile.name === 'Your Name' ? profileName : creatorProfile.name;
  const builderPhoto = getAvatarUrl(creatorProfile.photo || user?.profileImage);
  return <main className="about-page">
    <header className="articles-heading about-heading">
      <div><span className="articles-eyebrow">THE BUILDER &amp; THE PROJECT</span><h1>About Bazzar</h1><p>A community marketplace and publishing platform built as a full-stack portfolio project.</p></div>
    </header>

    <section className="about-builder-card" aria-labelledby="about-builder-title">
      <div className="about-profile-photo" role="img" aria-label={builderPhoto ? `${builderName}'s profile photo` : 'Demo profile photo placeholder'}>
        {builderPhoto ? <img src={builderPhoto} alt={builderName} /> : <div className="about-profile-placeholder"><Camera size={22} /><strong>{builderName.slice(0, 2).toUpperCase()}</strong><span>Add a profile photo</span></div>}
      </div>
      <div className="about-builder-copy">
        <span className="about-section-kicker">MEET THE BUILDER</span>
        <h2 id="about-builder-title">{builderName}</h2>
        <p className="about-builder-role">{creatorProfile.role}</p>
        <p className="about-builder-location">{creatorProfile.location}</p>
        <p className="about-builder-intro">{creatorProfile.introduction}</p>
        <div className="about-builder-note"><FileText size={15} /><span>These demo details can be personalized in <code>AboutPage.jsx</code>. Your account photo is shown until you add a custom one.</span></div>
      </div>
    </section>

    <section className="about-project-intro">
      <div><span className="about-section-kicker">WHY BAZZAR</span><h2>Useful things belong in one place.</h2></div>
      <p>Bazzar brings local buying and selling, community conversations, and practical articles together. The project explores the product and engineering work behind a modern, multi-feature web application.</p>
    </section>

    <section className="about-highlights-section" aria-labelledby="about-highlights-title">
      <div className="about-section-heading"><div><span className="about-section-kicker">WHAT IT CAN DO</span><h2 id="about-highlights-title">One platform, connected experiences</h2></div></div>
      <div className="about-highlights-grid">
        {projectHighlights.map(({ Icon, title, text }) => <article className="about-highlight-card" key={title}>
          <span className="about-highlight-icon"><Icon size={19} /></span>
          <h3>{title}</h3>
          <p>{text}</p>
        </article>)}
      </div>
    </section>

    <section className="about-tech-section" aria-labelledby="about-tech-title">
      <div className="about-section-heading"><div><span className="about-section-kicker">BUILT WITH</span><h2 id="about-tech-title">Technologies behind Bazzar</h2></div></div>
      <div className="about-tech-grid">
        {technologyGroups.map(({ Icon, title, technologies }) => <article className="about-tech-card" key={title}>
          <div className="about-tech-title"><Icon size={17} /><h3>{title}</h3></div>
          <div className="about-tech-tags">{technologies.map(technology => <span key={technology}>{technology}</span>)}</div>
        </article>)}
      </div>
      <p className="about-tech-note">Socket.IO powers live, event-based messaging between the React client and Node/Express server. MongoDB stores application data, while Mongoose defines and queries its data models.</p>
    </section>

    <footer className="about-footer">Bazzar <span>·</span> Built with curiosity, care, and a full-stack toolkit</footer>
  </main>;
};

export default AboutPage;
