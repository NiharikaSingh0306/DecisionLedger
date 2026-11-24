
import { useEffect, useState } from 'react'
import { Search, Filter, RefreshCw, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
    getDecisions,
    type Decision,
    type DecisionStatus,
} from '../services/api'

function ExploreDecisions() {
    const navigate = useNavigate()
    const [decisions, setDecisions] = useState<Decision[]>([])
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [owner, setOwner] = useState('')
    const [visibility, setVisibility] = useState<'' | 'PUBLIC' | 'PRIVATE'>('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchDecisions = async () => {
            setLoading(true)
            setError('')

            try {
                const response = await getDecisions({
                    search: search || undefined,
                    status: (status || undefined) as DecisionStatus | undefined,
                    owner: owner || undefined,
                    visibility: visibility || undefined,
                    page,
                    limit: 10,
                })

                setDecisions(response.data)
                setTotalPages(response.pagination.totalPages)
                setTotal(response.pagination.total)
            } catch (err) {
                if (axios.isAxiosError(err)) {
                    setError(
                        err.response?.data?.message ||
                        'Unable to load decisions. Please try again.'
                    )
                } else {
                    setError('Something went wrong.')
                }
            } finally {
                setLoading(false)
            }
        }

        fetchDecisions()
    }, [search, status, owner, visibility, page])

    const handleFilterChange = <T extends string>(
        setter: React.Dispatch<React.SetStateAction<T>>
    ) => {
        return (value: T) => {
            setter(value)
            setPage(1)
        }
    }

    const getStatusStyle = (value: DecisionStatus) => {
        switch (value) {
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

    return (
        <main className="min-h-screen bg-[#101824] text-[#F3EBDD] px-6 py-10">
            <div className="max-w-6xl mx-auto">

                <p className="text-sm tracking-widest uppercase text-[#C98F83] mb-3">
                    DecisionLedger
                </p>
                <button
                    onClick={() => navigate('/home')}
                    className="mb-6 flex items-center gap-2 text-sm text-[#C98F83] hover:text-[#F3EBDD] transition"
                >
                    <ArrowLeft size={17} />
                    Back to Home
                </button>

                <h1 className="text-3xl font-semibold mb-3">
                    Explore Decisions
                </h1>

                <p className="text-[#A9A6A1] mb-8">
                    Browse, search and track your recorded decisions.
                </p>

                {/* Search and filters */}
                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

                    {/* Search */}
                    <div className="relative">
                        <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A9A6A1]"
                        />
                        <input
                            type="text"
                            placeholder="Search decisions..."
                            value={search}
                            onChange={(e) => handleFilterChange(setSearch)(e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-[#17212F] pl-11 pr-4 py-3 text-sm outline-none focus:border-[#C98F83]"
                        />
                    </div>

                    {/* Status */}
                    <div className="relative">
                        <Filter
                            size={17}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A9A6A1]"
                        />
                        <select
                            value={status}
                            onChange={(e) => handleFilterChange(setStatus)(e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-[#17212F] pl-11 pr-4 py-3 text-sm text-[#F3EBDD] outline-none focus:border-[#C98F83]"
                        >
                            <option value="">All statuses</option>
                            <option value="PROPOSED">Proposed</option>
                            <option value="ACCEPTED">Accepted</option>
                            <option value="SUPERSEDED">Superseded</option>
                            <option value="REVERSED">Reversed</option>
                        </select>
                    </div>

                    {/* Owner */}
                    <input
                        type="text"
                        placeholder="Filter by owner..."
                        value={owner}
                        onChange={(e) => handleFilterChange(setOwner)(e.target.value)}
                        className="w-full rounded-lg border border-white/15 bg-[#17212F] px-4 py-3 text-sm outline-none focus:border-[#C98F83]"
                    />

                    {/* Visibility */}
                    <select
                        value={visibility}
                        onChange={(e) => handleFilterChange(setVisibility)(e.target.value as '' | 'PUBLIC' | 'PRIVATE')}
                        className="w-full rounded-lg border border-white/15 bg-[#17212F] px-4 py-3 text-sm text-[#F3EBDD] outline-none focus:border-[#C98F83]"
                    >
                        <option value="">All visibility</option>
                        <option value="PUBLIC">Public</option>
                        <option value="PRIVATE">Private</option>
                    </select>

                </div>

                {/* Results heading */}
                <div className="flex items-center justify-between mb-5">
                    <p className="text-sm text-[#A9A6A1]">
                        {total} {total === 1 ? 'decision' : 'decisions'} found
                    </p>

                    <button
                        onClick={() => {
                            setSearch('')
                            setStatus('')
                            setOwner('')
                            setPage(1)
                        }}
                        className="flex items-center gap-2 text-sm text-[#C98F83] hover:text-[#F3EBDD]"
                    >
                        <RefreshCw size={15} />
                        Clear filters
                    </button>
                </div>

                {/* Loading */}
                {loading && (
                    <p className="text-center text-[#A9A6A1] py-12">
                        Loading decisions...
                    </p>
                )}

                {/* Error */}
                {!loading && error && (
                    <p className="text-center text-red-400 py-12">
                        {error}
                    </p>
                )}

                {/* Empty state */}
                {!loading && !error && decisions.length === 0 && (
                    <div className="text-center py-16 border border-white/10 rounded-xl bg-[#17212F]">
                        <h2 className="text-xl font-semibold mb-2">
                            No decisions found
                        </h2>
                        <p className="text-sm text-[#A9A6A1]">
                            Try changing your filters or create a new decision.
                        </p>
                    </div>
                )}

                {/* Decision cards */}
                {!loading && !error && decisions.length > 0 && (
                    <div className="space-y-4">

                        {decisions.map((decision) => (
                            <article onClick={() => navigate(`/decisions/${decision.id}`)}
                                key={decision.id}
                                className="cursor-pointer rounded-xl border border-white/10 bg-[#17212F] p-6 hover:border-[#702C43] transition"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-4">

                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-lg font-semibold mb-2">
                                            {decision.title}
                                        </h2>

                                        <p className="text-sm text-[#A9A6A1] mb-3">
                                            {decision.decisionSummary}
                                        </p>

                                        <p className="text-xs text-[#A9A6A1]">
                                            Owner: {decision.owner || 'Not assigned'}
                                        </p>
                                        <p>
                                            <span className="font-medium">Created by:</span>{" "}
                                            {decision.user.email}
                                        </p>
                                    </div>

                                    <span
                                        className={`text-xs border rounded-full px-3 py-1 ${getStatusStyle(decision.status)}`}
                                    >
                                        {decision.status}
                                    </span>

                                </div>

                                <div className="mt-5 pt-4 border-t border-white/10 text-xs text-[#A9A6A1]">
                                    Created: {new Date(decision.createdAt).toLocaleDateString()}
                                </div>
                            </article>
                        ))}

                    </div>
                )}

                {/* Pagination */}
                {!loading && !error && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-5 mt-8">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage((current) => current - 1)}
                            className="px-4 py-2 rounded-lg border border-white/15 disabled:opacity-30 hover:border-[#C98F83]"
                        >
                            Previous
                        </button>

                        <span className="text-sm text-[#A9A6A1]">
                            Page {page} of {totalPages}
                        </span>

                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage((current) => current + 1)}
                            className="px-4 py-2 rounded-lg border border-white/15 disabled:opacity-30 hover:border-[#C98F83]"
                        >
                            Next
                        </button>
                    </div>
                )}

            </div>
        </main>
    )
}

export default ExploreDecisions
