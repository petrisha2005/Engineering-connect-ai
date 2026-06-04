import { RefreshCw, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MatchCard } from "../components/matches/MatchCard";
import { Button } from "../components/ui/Button";
import { useMatchStore } from "../store/matchStore";

export function MatchesPage() {
  const { matches, status, error, loadMatches, refreshMatches } = useMatchStore();
  const isBusy = status === "loading" || status === "generating";

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">AI matching engine</p>
          <h1 className="mt-2 text-3xl font-semibold">Recommended students</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Matches are generated from real MongoDB profiles using shared skills, interests, career goals, branch, college, year, and availability.
          </p>
        </div>
        <Button disabled={isBusy} onClick={refreshMatches}>
          <RefreshCw size={17} />
          {status === "generating" ? "Generating..." : "Generate matches"}
        </Button>
      </div>

      {status === "error" && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-5 text-sm text-red-700">
          <p>{error}</p>
          {error?.includes("profile") && (
            <Link className="mt-3 inline-flex font-semibold" to="/profile">
              Create your profile
            </Link>
          )}
        </div>
      )}

      {isBusy && <p className="text-sm text-muted-foreground">Loading recommendations...</p>}

      {status === "ready" && matches.length === 0 && (
        <section className="rounded-lg border border-border bg-card p-8">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles size={20} />
            <span className="text-sm font-semibold">No stored matches yet</span>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Generate matches after students have created profiles with overlapping skills, interests, or career goals.
          </p>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {matches.map((match) => (
          <MatchCard key={match._id} match={match} />
        ))}
      </section>
    </main>
  );
}

