
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import {
    getDecisionById,
    updateDecision,
    type Decision,
    type DecisionStatus,
    type DecisionVisibility,
} from '../services/api'

function EditDecision() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [decision, setDecision] = useState<Decision | null>(null)
    const [title, setTitle] = useState('')
    const [context, setContext] = useState('')
    const [decisionSummary, setDecisionSummary] = useState('')
    const [rationale, setRationale] = useState('')
    const [owner, setOwner] = useState('')
    const [options, setOptions] = useState('')
    const [status, setStatus] = useState<DecisionStatus>('PROPOSED')
    const [visibility, setVisibility] = useState<DecisionVisibility>('PRIVATE')
    const [commitMessage, setCommitMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchDecision = async () => {
            if (!id) {
                setError('Invalid decision ID.')
                setLoading(false)
                return
            }

            try {
                const data = await getDecisionById(id)

                setDecision(data)
                setTitle(data.title)
                setContext(data.context)
                setDecisionSummary(data.decisionSummary)
                setRationale(data.rationale)
                setOwner(data.owner || '')
                setOptions((data.options || []).join('\n'))
                setStatus(data.status)
                setVisibility(data.visibility)
            } catch (err) {
                if (axios.isAxiosError(err)) {
                    setError(
                        err.response?.data?.message ||
                        'Unable to load decision.'
                    )
                } else {
                    setError('Something went wrong.')
                }
            } finally {
                setLoading(false)
            }
        }

        fetchDecision()
    }, [id])

    const allowedTransitions: Record<DecisionStatus, DecisionStatus[]> = {
        PROPOSED: ['ACCEPTED', 'REVERSED'],
        ACCEPTED: ['SUPERSEDED', 'REVERSED'],
        SUPERSEDED: [],
        REVERSED: [],
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!id || !decision) return

        setSaving(true)
        setError('')

        try {
            await updateDecision(id, {
                title,
                context,
                decisionSummary,
                rationale,
                owner: owner.trim() || undefined,
                options: options.trim()
                    ? options.split('\n').map((item) => item.trim()).filter(Boolean)
                    : [],
                status,
                visibility,
                commitMessage: commitMessage.trim() || 'Decision updated',
            })

            navigate(`/decisions/${id}`)
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const message = err.response?.data?.message

                setError(
                    Array.isArray(message)
                        ? message.join(', ')
                        : message || 'Unable to update decision.'
                )
            } else {
                setError('Something went wrong.')
            }
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-[#101824] text-[#A9A6A1] grid place-items-center">
                Loading decision...
            </main>
        )
    }

    if (!decision) {
        return (
            <main className="min-h-screen bg-[#101824] text-[#F3EBDD] px-6 py-12">
                <div className="max-w-2xl mx-auto">
                    <p className="text-red-400 mb-6">
                        {error || 'Decision not found.'}
                    </p>
                    <button
                        onClick={() => navigate('/decisions')}
                        className="text-[#C98F83]"
                    >
                        Back to decisions
                    </button>
                </div>
            </main>
        )
    }

    const availableStatuses = [
        decision.status,
        ...allowedTransitions[decision.status],
    ]

    return (
        <main className="min-h-screen bg-[#101824] text-[#F3EBDD] px-6 py-10">
            <div className="max-w-2xl mx-auto">

                <button
                    type="button"
                    onClick={() => navigate(`/decisions/${id}`)}
                    className="text-sm text-[#C98F83] mb-8 hover:text-[#F3EBDD]"
                >
                    ← Back to decision
                </button>

                <p className="text-sm tracking-widest uppercase text-[#C98F83] mb-3">
                    DecisionLedger
                </p>

                <h1 className="text-3xl font-semibold mb-3">
                    Edit Decision
                </h1>

                <p className="text-[#A9A6A1] mb-8">
                    Changes are recorded as a new version in the decision history.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">

                    <div>
                        <label className="block text-sm mb-2">Decision Title</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full rounded-lg border border-white/20 bg-[#17212F] px-4 py-3 outline-none focus:border-[#C98F83]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-2">Context</label>
                        <textarea
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            required
                            rows={4}
                            className="w-full rounded-lg border border-white/20 bg-[#17212F] px-4 py-3 outline-none focus:border-[#C98F83] resize-y"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-2">Decision Summary</label>
                        <textarea
                            value={decisionSummary}
                            onChange={(e) => setDecisionSummary(e.target.value)}
                            required
                            rows={3}
                            className="w-full rounded-lg border border-white/20 bg-[#17212F] px-4 py-3 outline-none focus:border-[#C98F83] resize-y"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-2">Rationale</label>
                        <textarea
                            value={rationale}
                            onChange={(e) => setRationale(e.target.value)}
                            required
                            rows={4}
                            className="w-full rounded-lg border border-white/20 bg-[#17212F] px-4 py-3 outline-none focus:border-[#C98F83] resize-y"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-2">Options considered</label>
                        <textarea
                            value={options}
                            onChange={(e) => setOptions(e.target.value)}
                            placeholder="Enter one option per line"
                            rows={3}
                            className="w-full rounded-lg border border-white/20 bg-[#17212F] px-4 py-3 outline-none focus:border-[#C98F83] resize-y"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-2">Owner</label>
                        <input
                            value={owner}
                            onChange={(e) => setOwner(e.target.value)}
                            placeholder="e.g. Engineering Team"
                            className="w-full rounded-lg border border-white/20 bg-[#17212F] px-4 py-3 outline-none focus:border-[#C98F83]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-2">
                            Decision Visibility
                        </label>
                        <select
                            value={visibility}
                            onChange={(e) =>
                                setVisibility(e.target.value as DecisionVisibility)
                            }
                            className="w-full rounded-lg border border-white/20 bg-[#17212F] px-4 py-3 outline-none focus:border-[#C98F83]"
                        >
                            <option value="PRIVATE">Private — Only I can view</option>
                            <option value="PUBLIC">Public — All users can view</option>
                        </select>
                        <p className="mt-2 text-xs text-[#A9A6A1]">
                            Public decisions can be viewed by other registered users.
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm mb-2">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as DecisionStatus)}
                            className="w-full rounded-lg border border-white/20 bg-[#17212F] px-4 py-3 outline-none focus:border-[#C98F83]"
                        >
                            {availableStatuses.map((value) => (
                                <option key={value} value={value}>
                                    {value}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm mb-2">
                            Change description (Commit Message)
                        </label>
                        <input
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                            placeholder="e.g. Updated database selection rationale"
                            className="w-full rounded-lg border border-white/20 bg-[#17212F] px-4 py-3 outline-none focus:border-[#C98F83]"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-400">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-[#702C43] px-6 py-3 font-semibold hover:bg-[#91445C] transition disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>

                </form>
            </div>
        </main>
    )
}

export default EditDecision
