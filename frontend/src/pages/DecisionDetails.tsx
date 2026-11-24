
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft } from 'lucide-react'
import {
    getDecisionById,
    type Decision,
} from '../services/api'

function DecisionDetails() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [decision, setDecision] = useState<Decision | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const user = JSON.parse(sessionStorage.getItem('user') || '{}')
    const isOwner = decision?.userId === user.id

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
            } catch (err) {
                if (axios.isAxiosError(err)) {
                    setError(
                        err.response?.data?.message ||
                        'Unable to load this decision.'
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

    const getStatusStyle = (status: Decision['status']) => {
        switch (status) {
            case 'PROPOSED':
                return 'border-[#C98F83] text-[#C98F83]'
            case 'ACCEPTED':
                return 'border-green-700 text-green-400'
            case 'SUPERSEDED':
                return 'border-yellow-700 text-yellow-400'
            case 'REVERSED':
                return 'border-red-800 text-red-400'
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-[#101824] text-[#A9A6A1] grid place-items-center">
                Loading decision...
            </main>
        )
    }

    if (error || !decision) {
        return (
            <main className="min-h-screen bg-[#101824] text-[#F3EBDD] px-6 py-12">
                <div className="max-w-3xl mx-auto">
                    <p className="text-red-400 mb-6">
                        {error || 'Decision not found.'}
                    </p>
                    <button
                        onClick={() => navigate('/decisions')}
                        className="text-[#C98F83] hover:text-[#F3EBDD]"
                    >
                        Back to decisions
                    </button>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-[#101824] text-[#F3EBDD] px-6 py-10">
            <div className="max-w-3xl mx-auto">

                <button
                    onClick={() => navigate('/decisions')}
                    className="flex items-center gap-2 text-sm text-[#C98F83] hover:text-[#F3EBDD] mb-10"
                >
                    <ArrowLeft size={17} />
                    Back to decisions
                </button>

                <p className="text-sm tracking-widest uppercase text-[#C98F83] mb-3">
                    Decision Details
                </p>


                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <h1 className="text-3xl font-semibold">
                        {decision.title}
                    </h1>

                    <div className="flex items-center gap-3">
                        <span
                            className={`text-xs border rounded-full px-3 py-1 ${getStatusStyle(decision.status)}`}
                        >
                            {decision.status}
                        </span>

                        {isOwner && (
                            <button
                                onClick={() => navigate(`/decisions/${decision.id}/edit`)}
                                className="rounded-lg bg-[#702C43] px-4 py-2 text-sm font-semibold hover:bg-[#91445C] transition"
                            >
                                Edit Decision
                            </button>
                        )}
                        <button
                            onClick={() => navigate(`/decisions/${decision.id}/history`)}
                            className="rounded-lg border border-[#702C43] px-4 py-2 text-sm hover:bg-[#702C43]/20 transition"
                        >
                            Version History
                        </button>
                    </div>
                </div>


                <div className="flex flex-wrap items-center gap-3 text-sm text-[#A9A6A1] mb-10">
                    <span>
                        Created on {new Date(decision.createdAt).toLocaleDateString()}
                    </span>

                    <span>·</span>

                    <span>Owner: {decision.owner || 'Not assigned'}</span>

                    <span>·</span>
                    <div>
                        <p className="text-sm text-gray-400">Created by</p>
                        <p className="font-medium">{decision.user.email}</p>
                    </div>

                    <span className={decision.visibility === 'PUBLIC' ? 'text-green-400' : 'text-[#C98F83]'}>
                        {decision.visibility === 'PUBLIC' ? 'Public' : 'Private'}
                    </span>

                    {!isOwner && (
                        <>
                            <span>·</span>
                            <span className="text-[#C98F83]">Read-only access</span>
                        </>
                    )}
                </div>

                <div className="space-y-6">

                    <section className="bg-[#17212F] border border-white/10 rounded-xl p-6">
                        <h2 className="text-lg font-semibold mb-3">
                            Context
                        </h2>
                        <p className="text-sm text-[#C5C0B8] leading-7 whitespace-pre-wrap">
                            {decision.context}
                        </p>
                    </section>

                    <section className="bg-[#17212F] border border-white/10 rounded-xl p-6">
                        <h2 className="text-lg font-semibold mb-3">
                            Decision Summary
                        </h2>
                        <p className="text-sm text-[#C5C0B8] leading-7 whitespace-pre-wrap">
                            {decision.decisionSummary}
                        </p>
                    </section>

                    <section className="bg-[#17212F] border border-white/10 rounded-xl p-6">
                        <h2 className="text-lg font-semibold mb-3">
                            Rationale
                        </h2>
                        <p className="text-sm text-[#C5C0B8] leading-7 whitespace-pre-wrap">
                            {decision.rationale}
                        </p>
                    </section>

                    {decision.options && decision.options.length > 0 && (
                        <section className="bg-[#17212F] border border-white/10 rounded-xl p-6">
                            <h2 className="text-lg font-semibold mb-3">
                                Options Considered
                            </h2>
                            <ul className="list-disc list-inside space-y-2 text-sm text-[#C5C0B8]">
                                {decision.options.map((option, index) => (
                                    <li key={index}>{option}</li>
                                ))}
                            </ul>
                        </section>
                    )}

                </div>
            </div>
        </main>
    )
}

export default DecisionDetails
