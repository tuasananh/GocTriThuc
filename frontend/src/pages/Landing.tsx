import { Link } from 'react-router-dom';

export default function Landing() {
    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>Welcome to the LMS</h1>
            <Link to="/login">
                <button>Go to Login</button>
            </Link>
        </div>
    );
}
