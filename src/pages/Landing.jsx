import React from 'react';
import { Link } from 'react-router-dom';
import './landing.css';

export default function Landing() {
    return (
        <div className="landing-root">
            <header className="landing-hero">
                <div className="landing-content">
                    <h1>Welcome to MedCare</h1>
                    <p>
                        Your health, simplified — find doctors, book
                        appointments, and manage care.
                    </p>
                    <div className="landing-actions">
                        <Link to="/register" className="btn btn-primary">
                            Get Started
                        </Link>
                        <Link to="/login" className="btn btn-outline">
                            Sign In
                        </Link>
                    </div>
                </div>
            </header>
            <section className="landing-features">
                <div className="feature">
                    <h3>Find Doctors</h3>
                    <p>Search by specialty, location, and ratings.</p>
                </div>
                <div className="feature">
                    <h3>Manage Appointments</h3>
                    <p>Easily schedule, view, and cancel visits.</p>
                </div>
                <div className="feature">
                    <h3>Secure Profile</h3>
                    <p>Personalized records and notifications.</p>
                </div>
            </section>
            <footer className="landing-footer">
                <p>© {new Date().getFullYear()} MedCare</p>
            </footer>
        </div>
    );
}
