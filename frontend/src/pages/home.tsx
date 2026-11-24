
import { useNavigate } from 'react-router-dom'
import { Plus, Search, LogOut, BookOpen } from 'lucide-react'

function Home() {
    const navigate = useNavigate()

    const user = JSON.parse(sessionStorage.getItem('user') || '{}')

    const handleLogout = () => {
        sessionStorage.removeItem('accessToken')
        sessionStorage.removeItem('user')
        navigate('/')
    }

    return (
        <main className="min-h-screen bg-[#101824] text-[#F3EBDD]">

            {/* Navigation */}
            <nav className="flex items-center justify-between px-8 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#702C43] flex items-center justify-center font-bold">
                        D
                    </div>
                    <span className="text-xl font-semibold tracking-wide">
                        DecisionLedger
                    </span>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm text-[#C98F83] hover:text-[#F3EBDD] transition"
                >
                    <LogOut size={17} />
                    Logout
                </button>
            </nav>

            {/* Main Content */}
            <section className="max-w-5xl mx-auto px-8 py-10">

                <p className="text-[#C98F83] text-sm tracking-widest uppercase mb-3">
                    Your workspace
                </p>

                <h1 className="text-3xl md:text-4xl font-semibold mb-3">
                    Your decisions,<br />
                    organized.
                </h1>

                <p className="text-[#A9A6A1] max-w-lg mb-8">
                    A central place to record, track, and understand
                    the decisions that shape your organization.
                </p>

                <div className="grid md:grid-cols-2 gap-6">

                    <button
                        onClick={() => navigate('/decisions/new')} className="text-left p-6 rounded-2xl border border-[#702C43] bg-[#17212F] hover:bg-[#702C43]/20 transition">
                        <Plus size={28} className="text-[#C98F83] mb-4" />
                        <h2 className="text-xl font-semibold mb-2">
                            Create a decision
                        </h2>
                        <p className="text-sm text-[#A9A6A1]">
                            Record a new decision with its context and rationale.
                        </p>
                    </button>

                    <button onClick={() => navigate('/decisions')} className="text-left p-8 rounded-2xl border border-white/10 bg-[#17212F] hover:border-[#C98F83] transition">
                        <Search size={28} className="text-[#C98F83] mb-6" />
                        <h2 className="text-xl font-semibold mb-2">
                            Explore decisions
                        </h2>
                        <p className="text-sm text-[#A9A6A1]">
                            Search and review previously recorded decisions.
                        </p>
                    </button>

                </div>

                <div className="mt-8 flex items-center gap-3 text-sm text-[#A9A6A1]">
                    <BookOpen size={17} />
                    Signed in as {user.email}
                </div>

            </section>
        </main>
    )
}

export default Home
