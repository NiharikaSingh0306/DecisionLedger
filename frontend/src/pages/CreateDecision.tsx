
import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { createDecision } from '../services/api'

function CreateDecision() {
    const navigate = useNavigate()
    const [owner, setOwner] = useState('')
    const [title, setTitle] = useState('')
    const [context, setContext] = useState('')
    const [decisionSummary, setDecisionSummary] = useState('')
    const [rationale, setRationale] = useState('')
    const [options, setOptions] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PRIVATE')

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await createDecision({
                title,
                context,
                decisionSummary,
                rationale,
                options: options.split('\n').map((option) => option.trim()).filter(Boolean),
                owner: owner.trim() || undefined,
                status: 'PROPOSED',
                visibility,
            })

            navigate('/home')
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const message = err.response?.data?.message
                setError(
                    Array.isArray(message)
                        ? message.join(', ')
                        : message || 'Unable to create decision. Please try again.'
                )
            } else {
                setError('Something went wrong. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-[#101824] text-[#F3EBDD] px-6 py-10">
            <div className="max-w-2xl mx-auto">

                <p className="text-sm tracking-widest uppercase text-[#C98F83] mb-3">
                    DecisionLedger
                </p>

                <h1 className="text-3xl font-semibold mb-3">
                    Create a Decision
                </h1>

                <p className="text-[#A9A6A1] mb-8">
                    Document an important decision and the reasoning behind it.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">

                    <div>
                        <label className="block text-sm mb-2">Decision Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Adopt PostgreSQL as our primary database"
                            required
                            className="w-full rounded-lg border border-white/20 bg-[#17212F] px-4 py-3 text-[#F3EBDD] outline-none focus:border-[#C98F83]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-2">Context</label>
                        <textarea
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            placeholder="What situation or problem led to this decision?"
                            required
                            rows={3}
                            className="w-full rounded-lg border border-white/20 bg-[#17212F] px-4 py-3 text-[#F3EBDD] outline-none focus:border-[#C98F83] resize-y"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-2">Decision Summary</label>
                        <textarea
                            value={decisionSummary}
                            onChange={(e) => setDecisionSummary(e.target.value)}
                            placeholder="What exactly has been decided?"
                            required
                            rows={3}
                            className="w-full rounded-lg border border-white/20 bg-[#17212F] px-4 py-3 text-[#F3EBDD] outline-none focus:border-[#C98F83] resize-y"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-2">
                            Options Considered (Optional)
                        </label>
                        <textarea
                            value={options}
                            onChange={(e) => setOptions(e.target.value)}
                            placeholder={'Enter each alternative on a new line:\nMySQL\nMongoDB\nPostgreSQL'}
                            rows={3}
                            className="w-full rounded-lg border border-white/20 bg-[#17212F] px-4 py-3 text-[#F3EBDD] outline-none focus:border-[#C98F83] resize-y"
                        />
                        <p className="mt-2 text-xs text-[#A9A6A1]">
                            Enter one option per line.
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm mb-2">Owner (Optional)</label>
                        <input
                            type="text"
                            value={owner}
                            onChange={(e) => setOwner(e.target.value)}
                            placeholder="e.g. Engineering Team"
                            className="w-full rounded-lg border border-white/20 bg-[#17212F] px-4 py-3 text-[#F3EBDD] outline-none focus:border-[#C98F83]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-2">Rationale</label>
                        <textarea
                            value={rationale}
                            onChange={(e) => setRationale(e.target.value)}
                            placeholder="Why is this the right decision?"
                            required
                            rows={3}
                            className="w-full rounded-lg border border-white/20 bg-[#17212F] px-4 py-3 text-[#F3EBDD] outline-none focus:border-[#C98F83] resize-y"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-2">Initial Status</label>
                        <input
                            type="text"
                            value="PROPOSED"
                            disabled
                            className="w-full rounded-lg border border-white/10 bg-[#17212F] px-4 py-3 text-[#C98F83] opacity-80"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-2">
                            Decision Visibility
                        </label>
                        <select
                            value={visibility}
                            onChange={(e) =>
                                setVisibility(e.target.value as 'PUBLIC' | 'PRIVATE')
                            }
                            className="w-full rounded-lg border border-white/20 bg-[#17212F] px-4 py-3 text-[#F3EBDD] outline-none focus:border-[#C98F83]"
                        >
                            <option value="PRIVATE">Private — Only I can view</option>
                            <option value="PUBLIC">Public — All users can view</option>
                        </select>
                        <p className="mt-2 text-xs text-[#A9A6A1]">
                            You can change this setting later.
                        </p>
                    </div>

                    {error && (
                        <p className="text-sm text-red-400">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-lg bg-[#702C43] px-6 py-3 font-semibold hover:bg-[#91445C] transition disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Decision'}
                    </button>

                </form>
            </div>
        </main>
    )
}

export default CreateDecision
