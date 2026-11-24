
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, GitCommitHorizontal, RotateCcw } from 'lucide-react'
import {
    getDecisionVersions,
    restoreDecisionVersion,
    type DecisionVersion,
    getDecisionById,
} from '../services/api'

function VersionHistory() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [versions, setVersions] = useState<DecisionVersion[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [restoringVersion, setRestoringVersion] = useState<number | null>(null)
    const [successMessage, setSuccessMessage] = useState('')
    const [expandedVersion, setExpandedVersion] = useState<number | null>(null)
    const [isOwner, setIsOwner] = useState(false)

    const fetchVersions = async () => {
        if (!id) {
            setError('Invalid decision ID.')
            setLoading(false)
            return
        }

        try {
            const data = await getDecisionVersions(id)
            setVersions(data)
            const decision = await getDecisionById(id)
            const user = JSON.parse(sessionStorage.getItem('user') || '{}')

            setIsOwner(decision.userId === user.id)
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.message ||
                    'Unable to load version history.'
                )
            } else {
                setError('Something went wrong.')
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchVersions()
    }, [id])

    const handleRestore = async (versionNumber: number) => {
        if (!id) return

        const confirmed = window.confirm(
            `Restore version ${versionNumber}? This will create a new version while preserving the existing history.`
        )

        if (!confirmed) return

        setRestoringVersion(versionNumber)
        setError('')
        setSuccessMessage('')

        try {
            const result = await restoreDecisionVersion(
                id,
                versionNumber,
                `Restored from version ${versionNumber}`
            )

            setSuccessMessage(
                `Successfully restored version ${versionNumber}. New version: ${result.newVersionNumber}.`
            )

            await fetchVersions()
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.message ||
                    'Unable to restore this version.'
                )
            } else {
                setError('Something went wrong while restoring.')
            }
        } finally {
            setRestoringVersion(null)
        }
    }

    return (
        <main className="min-h-screen bg-[#101824] text-[#F3EBDD] px-6 py-10">
            <div className="max-w-3xl mx-auto">

                <button
                    onClick={() => navigate(`/decisions/${id}`)}
                    className="flex items-center gap-2 text-sm text-[#C98F83] hover:text-[#F3EBDD] mb-10"
                >
                    <ArrowLeft size={17} />
                    Back to decision
                </button>

                <p className="text-sm tracking-widest uppercase text-[#C98F83] mb-3">
                    DecisionLedger
                </p>

                <h1 className="text-3xl font-semibold mb-4">
                    Version History
                </h1>

                <button
                    onClick={() => navigate(`/decisions/${id}/compare`)}
                    className="rounded-lg bg-[#702C43] px-5 py-2 text-sm font-medium text-[#F3EBDD] hover:bg-[#91445C] mb-6"
                >
                    Compare Versions →
                </button>

                <p className="text-[#A9A6A1] mb-10">
                    Every change is recorded. Previous versions remain preserved.
                </p>

                {successMessage && (
                    <p className="mb-6 rounded-lg border border-green-700/40 bg-green-950/30 p-4 text-sm text-green-300">
                        {successMessage}
                    </p>
                )}

                {loading && (
                    <p className="text-center text-[#A9A6A1] py-12">
                        Loading version history...
                    </p>
                )}

                {!loading && error && (
                    <p className="text-center text-red-400 py-6">
                        {error}
                    </p>
                )}

                {!loading && !error && versions.length === 0 && (
                    <p className="text-center text-[#A9A6A1] py-12">
                        No versions found.
                    </p>
                )}

                {!loading && versions.length > 0 && (
                    <div className="relative border-l border-[#702C43] ml-3 space-y-8 pl-8">

                        {versions.map((version, index) => (
                            <article key={version.id} className="relative">

                                <div className="absolute -left-[43px] top-1 w-7 h-7 rounded-full bg-[#702C43] flex items-center justify-center">
                                    <GitCommitHorizontal size={16} />
                                </div>

                                <div className="bg-[#17212F] border border-white/10 rounded-xl p-6">

                                    <div className="flex flex-wrap justify-between gap-3 mb-4">
                                        <h2 className="text-lg font-semibold">
                                            Version {version.versionNumber}
                                        </h2>

                                        {index === 0 && (
                                            <span className="text-xs text-[#C98F83] border border-[#702C43] rounded-full px-3 py-1">
                                                Latest version
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="font-medium mb-2">
                                        {version.title}
                                    </h3>

                                    <p className="text-sm text-[#A9A6A1] mb-4">
                                        {version.commitMessage || 'No change description'}
                                    </p>

                                    <div className="flex flex-wrap gap-4 text-xs text-[#A9A6A1]">

                                        <button
                                            onClick={() =>
                                                setExpandedVersion(
                                                    expandedVersion === version.versionNumber
                                                        ? null
                                                        : version.versionNumber
                                                )
                                            }
                                            className="mt-5 text-sm text-[#C98F83] hover:text-[#F3EBDD]"
                                        >
                                            {expandedVersion === version.versionNumber
                                                ? 'Hide full version ↑'
                                                : 'View full version ↓'}
                                        </button>

                                        {expandedVersion === version.versionNumber && (
                                            <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
                                                <div>
                                                    <h4 className="text-sm font-semibold mb-1">Context</h4>
                                                    <p className="text-sm text-[#A9A6A1] whitespace-pre-wrap">
                                                        {version.context}
                                                    </p>
                                                </div>

                                                <div>
                                                    <h4 className="text-sm font-semibold mb-1">Decision Summary</h4>
                                                    <p className="text-sm text-[#A9A6A1] whitespace-pre-wrap">
                                                        {version.decisionSummary}
                                                    </p>
                                                </div>

                                                <div>
                                                    <h4 className="text-sm font-semibold mb-1">Rationale</h4>
                                                    <p className="text-sm text-[#A9A6A1] whitespace-pre-wrap">
                                                        {version.rationale}
                                                    </p>
                                                </div>

                                                <div>
                                                    <h4 className="text-sm font-semibold mb-1">Options Considered</h4>
                                                    {version.options && version.options.length > 0 ? (
                                                        <ul className="list-disc pl-5 text-sm text-[#A9A6A1] space-y-1">
                                                            {version.options.map((option, optionIndex) => (
                                                                <li key={optionIndex}>{option}</li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-sm text-[#A9A6A1]">No options recorded.</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <h4 className="text-sm font-semibold mb-1">Owner</h4>
                                                    <p className="text-sm text-[#A9A6A1]">
                                                        {version.owner || 'Not assigned'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <span>Status: {version.status}</span>
                                        <span>
                                            {new Date(version.createdAt).toLocaleString()}
                                        </span>
                                    </div>

                                    {isOwner && index !== 0 && (
                                        <button
                                            onClick={() => handleRestore(version.versionNumber)}
                                            disabled={restoringVersion !== null}
                                            className="mt-5 flex items-center gap-2 rounded-lg border border-[#C98F83]/40 px-4 py-2 text-sm text-[#C98F83] hover:bg-[#702C43]/30 disabled:opacity-50"
                                        >
                                            <RotateCcw size={15} />
                                            {restoringVersion === version.versionNumber
                                                ? 'Restoring...'
                                                : 'Restore this version'}
                                        </button>
                                    )}

                                </div>
                            </article>
                        ))}

                    </div>
                )}

            </div>
        </main>
    )
}

export default VersionHistory
