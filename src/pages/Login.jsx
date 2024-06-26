import { useState, useContext, useEffect } from 'react';
import { UserContext } from '../components/context/UserContext';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import { signIn } from '../Firebase/firebaseAuth';
import { useNavigate } from 'react-router-dom';




const Login = () => {
    const {user} = useContext(UserContext);
    const [errors, setErrors] = useState({
        email: '',
        password: ''
    });
    const [form, setForm] = useState({
        email: '',
        password: ''
    
    });
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate(-1);
        }
    }, [user]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            await signIn(form.email, form.password);
        }
        catch (error) {
            setErrors({email: 'Invalid email or password', password: 'Invalid email or password'});
        }

    }
    const handleChange = (e) => {
        const {name, value} = e.target;
        setForm({...form, [name]: value});
        setErrors({...form, [name]: ''});
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            textAlign: 'center',
            gap: '1rem',
            width: '95%',
            maxWidth: '400px',
            margin: 'auto',
            padding: '1rem'
        
        }}className='fadeIn'>
            <Typography  variant="h4" component="h1" gutterBottom>Sign In</Typography>
            <Typography variant="body1" gutterBottom>Sign in to your Bobbit account to connect with your favorite communities</Typography>

            <form style={{display: 'flex', flexDirection: 'column', gap: '10px'}} onSubmit={handleSubmit}>
                <TextField name='email' fullWidth  label="Email" variant="outlined"  onChange={handleChange} />
                <TextField fullWidth name='password' label="Password" variant="outlined" type="password" error={errors.password.length > 1 ? errors.password : false} onChange={handleChange}/>
                <Button fullWidth variant="contained" color="primary" type='submit'>
                    Login
                </Button>

            </form>
            <Link to="/signup" >
                <Typography variant="body2" color="primary">Don't have an account? Register here</Typography>
            </Link>

            <Link to="/forgot-password" >
                <Typography variant="body2" color="primary">Forgot your password?</Typography>
            </Link>
            
        </div>
    );
};

export default Login;
