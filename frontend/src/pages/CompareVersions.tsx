
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    getDecisionVersions,
    compareDecisionVersions,
    type DecisionVersion,
    type VersionComparison,
} from '../services/api'

function CompareVersions() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [versions, setVersions] = useState<DecisionVersion[]>([])
    const [fromVersion, setFromVersion] = useState('')
    const [toVersion, setToVersion] = useState('')
    const [comparison, setComparison] = useState<VersionComparison | null>(null)
    const [loading, setLoading] = useState(true)
    const [comparing, setComparing] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!id) return

        getDecisionVersions(id)
            .then((data) => {
                setVersions(data)
                if (data.length >= 2) {
                    setFromVersion(String(data[data.length - 1].versionNumber))
                    setToVersion(String(data[0].versionNumber))
                }
            })
            .catch(() => setError('Could not load decision versions.'))
            .finally(() => setLoading(false))
    }, [id])

    const handleCompare = async () => {
        if (!id || !fromVersion || !toVersion) return

        if (fromVersion === toVersion) {
            setError('Please select two different versions.')
            return
        }

        setComparing(true)
        setError('')
        setComparison(null)

        try {
            const result = await compareDecisionVersions(
                id,
                Number(fromVersion),
                Number(toVersion),
            )
            setComparison(result)
        } catch {
            setError('Could not compare these versions.')
        } finally {
            setComparing(false)
        }
    }

    if (loading) return <p className="p-8 text-center">Loading versions...</p>

    return (
        <main className="min-h-screen bg-[#101824] px-6 py-10 text-[#F3EBDD]">
            <div className="mx-auto max-w-4xl">
                <button
                    onClick={() => navigate(`/decisions/${id}/history`)}
                    className="mb-6 text-sm text-[#C98F83] hover:underline"
                >
                    ← Back to version history
                </button>

                <h1 className="mb-2 text-3xl font-semibold">Compare Versions</h1>
                <p className="mb-8 text-sm text-[#A9A6A1]">
                    Select two versions to see what changed between them.
                </p>

                {versions.length < 2 ? (
                    <p className="rounded-lg border border-white/10 p-5 text-[#A9A6A1]">
                        You need at least two versions to compare.
                    </p>
                ) : (
                    <>
                        <div className="grid gap-5 rounded-xl border border-white/10 bg-[#17212F] p-6 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm">From version</label>
                                <select
                                    value={fromVersion}
                                    onChange={(e) => setFromVersion(e.target.value)}
                                    className="w-full rounded-lg border border-white/15 bg-[#101824] p-3 text-[#F3EBDD]"
                                >
                                    {versions.map((version) => (
                                        <option key={version.id} value={version.versionNumber}>
                                            Version {version.versionNumber}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm">To version</label>
                                <select
                                    value={toVersion}
                                    onChange={(e) => setToVersion(e.target.value)}
                                    className="w-full rounded-lg border border-white/15 bg-[#101824] p-3 text-[#F3EBDD]"
                                >
                                    {versions.map((version) => (
                                        <option key={version.id} value={version.versionNumber}>
                                            Version {version.versionNumber}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleCompare}
                                disabled={comparing}
                                className="rounded-lg bg-[#702C43] px-5 py-3 font-medium hover:bg-[#91445C] disabled:opacity-50 md:col-span-2"
                            >
                                {comparing ? 'Comparing...' : 'Compare Versions'}
                            </button>
                        </div>

                        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

                        {comparison && (
                            <section className="mt-8">
                                <h2 className="mb-4 text-xl font-semibold">
                                    Changes Found
                                </h2>

                                {Object.keys(comparison.changes).length === 0 ? (
                                    <p className="rounded-lg border border-white/10 p-5 text-[#A9A6A1]">
                                        No changes between these versions.
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {Object.entries(comparison.changes).map(
                                            ([field, values]) => (
                                                <div
                                                    key={field}
                                                    className="rounded-xl border border-white/10 bg-[#17212F] p-5"
                                                >
                                                    <h3 className="mb-4 font-semibold capitalize">
                                                        {field.replace(/([A-Z])/g, ' $1')}
                                                    </h3>

                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <div className="rounded-lg bg-red-950/30 p-4">
                                                            <p className="mb-2 text-xs uppercase text-red-300">
                                                                Version {comparison.fromVersion}
                                                            </p>
                                                            <pre className="whitespace-pre-wrap break-words text-sm">
                                                                {JSON.stringify(values.old, null, 2) ?? '—'}
                                                            </pre>
                                                        </div>

                                                        <div className="rounded-lg bg-green-950/30 p-4">
                                                            <p className="mb-2 text-xs uppercase text-green-300">
                                                                Version {comparison.toVersion}
                                                            </p>
                                                            <pre className="whitespace-pre-wrap break-words text-sm">
                                                                {JSON.stringify(values.new, null, 2) ?? '—'}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </section>
                        )}
                    </>
                )}

                {error && versions.length < 2 && (
                    <p className="mt-4 text-sm text-red-400">{error}</p>
                )}
            </div>
        </main>
    )
}

export default CompareVersions
