
import { useState, type CSSProperties, type FormEvent } from 'react'
import axios from 'axios'
import { registerUser } from '../services/api'
import '../App.css'

function Signup() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        setError('')
        setSuccess('')

        if (password.length < 8) {
            setError('Password must contain at least 8 characters.')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        setLoading(true)

        try {
            await registerUser(email, password)

            setSuccess('Account created successfully! You can now sign in.')

            setEmail('')
            setPassword('')
            setConfirmPassword('')
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const message = err.response?.data?.message

                setError(
                    Array.isArray(message)
                        ? message.join(', ')
                        : message || 'Unable to create account. Please try again.'
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

                    <h2>Create Account</h2>

                    <p className="subtitle">
                        Begin your decision journey.
                    </p>

                    <form onSubmit={handleSignup}>
                        <div className="inputBx">
                            <input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className="inputBx">
                            <input
                                type="password"
                                placeholder="Create password (min. 8 characters)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                minLength={8}
                                required
                            />
                        </div>

                        <div className="inputBx">
                            <input
                                type="password"
                                placeholder="Confirm password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        <div className="inputBx">
                            <input
                                type="submit"
                                value={loading ? 'Creating account...' : 'Create Account'}
                                disabled={loading}
                            />
                        </div>
                    </form>

                    {error && <p className="auth-error">{error}</p>}
                    {success && <p className="auth-success">{success}</p>}

                    <div className="links">
                        <a href="/">Already registered? Sign in</a>
                    </div>
                </div>
            </div>

            <footer className="footer">
                DECISIONLEDGER © 2026
            </footer>
        </main>
    )
}

export default Signup
