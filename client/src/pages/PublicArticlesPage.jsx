import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import ArticlesPage from './ArticlesPage';

export default function PublicArticlesPage() {
  return <div className="public-journal-page">
    <header className="public-journal-header">
      <Link to="/home" className="public-journal-brand"><span><ShoppingBag size={18} /></span>Bazzar</Link>
      <nav aria-label="Journal navigation"><Link to="/login">Sign in</Link><Link className="public-journal-market-link" to="/login">Explore marketplace <ArrowRight size={15} /></Link></nav>
    </header>
    <main className="public-journal-content"><ArticlesPage user={null} publicOnly /></main>
  </div>;
}
