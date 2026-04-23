export default function Login() {
    const handleGoogleLogin = () => {
        window.location.href = '/oauth2/authorization/google';
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2>Sign In</h2>
            <button onClick={handleGoogleLogin}>Log in with Google</button>
        </div>
    );
}
