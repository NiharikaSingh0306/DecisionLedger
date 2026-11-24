
import { useState, type CSSProperties, type FormEvent } from 'react'
import axios from 'axios'
import '../App.css'
import { loginUser } from '../services/api'
import { useNavigate } from 'react-router-dom'

function login() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        setError('')
        setSuccess('')
        setLoading(true)

        try {
            const data = await loginUser(email, password)

            // Store the JWT for the current browser session
            sessionStorage.setItem('accessToken', data.accessToken)
            sessionStorage.setItem('user', JSON.stringify(data.user))

            navigate('/home')
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.message || 'Unable to login. Please try again.'
                )
            } else {
                setError('Something went wrong. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="page">
            <div className="ring">
                <i style={{ '--clr': '#91445C' } as CSSProperties} />
                <i style={{ '--clr': '#C98F83' } as CSSProperties} />
                <i style={{ '--clr': '#F3EBDD' } as CSSProperties} />

                <div className="login">
                    <div className="brand">D.</div>

                    <h2>Welcome Back</h2>
                    <p className="subtitle">Your decisions. Your history.</p>

                    <form onSubmit={handleLogin}>
                        <div className="inputBx">
                            <input
                                type="email"
                                placeholder="Email address"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="inputBx">
                            <input
                                type="password"
                                placeholder="Password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="inputBx">
                            <input
                                type="submit"
                                value={loading ? 'Signing in...' : 'Sign in'}
                                disabled={loading}
                            />
                        </div>
                    </form>

                    {error && <p className="auth-error">{error}</p>}
                    {success && <p className="auth-success">{success}</p>}

                    <div className="links">
                        <a href="#forgot-password">Forgot Password?</a>
                        <a href="/signup">Sign up</a>
                    </div>
                </div>
            </div>

            <footer className="footer">
                DECISIONLEDGER © 2026
            </footer>
        </main>
    )
}

export default login
