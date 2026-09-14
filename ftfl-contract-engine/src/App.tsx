import { useMemo, useState } from 'react';
import { realContracts } from './data/realContracts';
import { teams, teamBySlug } from './data/teams';
import {
  Contract,
  SALARY_CAP,
  contractsForTeam,
  cutPenalty,
  endYear,
  irCount,
  isIR,
  isTaxi,
  projectedResignCost,
  rosterCount,
  salaryInYear,
  startYear,
  taxiCount,
  teamCapSpace,
  teamCapUsed,
  yearsRemaining,
} from './lib/contracts';

const YEARS = [2025, 2026, 2027, 2028, 2029];
const POSITIONS = ['QB', 'RB', 'WR', 'TE'];

function money(n: number | null): string {
  if (n == null) return '—';
  return `$${n}`;
}

export default function App() {
  const [year, setYear] = useState(2026);
  const [mode, setMode] = useState<'summary' | 'team'>('summary');
  const [teamSlug, setTeamSlug] = useState(teams[0].slug);
  const team = teamBySlug(teamSlug);

  const themeVars =
    mode === 'team'
      ? { ['--bg' as any]: team.bg, ['--accent' as any]: team.accent, ['--accent2' as any]: team.accent2, ['--on-accent' as any]: team.onAccent }
      : { ['--bg' as any]: '#14161a', ['--accent' as any]: '#7f8a9e', ['--accent2' as any]: '#7f8a9e', ['--on-accent' as any]: '#0b0c10' };

  return (
    <div className="page" style={themeVars}>
      <nav className="team-rail">
        <button
          className={`team-chip summary-chip ${mode === 'summary' ? 'active' : ''}`}
          style={{ ['--chip' as any]: '#7f8a9e' }}
          onClick={() => setMode('summary')}
          title="League summary"
        >
          <span aria-hidden="true">⊞</span>
        </button>
        {teams.map((t) => (
          <button
            key={t.slug}
            className={`team-chip ${mode === 'team' && t.slug === teamSlug ? 'active' : ''}`}
            style={{ ['--chip' as any]: t.accent }}
            onClick={() => {
              setTeamSlug(t.slug);
              setMode('team');
            }}
            title={t.name}
          >
            <img src={t.logo} alt="" />
          </button>
        ))}
        <div className="year-picker rail-year">
          <label htmlFor="year">Viewing</label>
          <select id="year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </nav>

      {mode === 'summary' ? (
        <LeagueSummary year={year} onSelectTeam={(slug) => { setTeamSlug(slug); setMode('team'); }} />
      ) : (
        <TeamPage teamSlug={teamSlug} year={year} />
      )}
    </div>
  );
}

function LeagueSummary({ year, onSelectTeam }: { year: number; onSelectTeam: (slug: string) => void }) {
  const rows = useMemo(
    () =>
      teams.map((t) => {
        const contracts = contractsForTeam(realContracts, t.slug);
        return {
          team: t,
          capUsed: teamCapUsed(contracts, year),
          capSpace: teamCapSpace(contracts, year),
          roster: rosterCount(contracts, year),
          taxi: taxiCount(contracts, year),
          ir: irCount(contracts, year),
        };
      }),
    [year]
  );

  return (
    <>
      <header className="page-header summary-header">
        <div>
          <h1>League summary — {year}</h1>
          <p className="sub">Click a team to open its full page.</p>
        </div>
      </header>

      <table>
        <thead>
          <tr>
            <th>Team</th>
            <th>Roster</th>
            <th>Taxi</th>
            <th>IR</th>
            <th>Cap used</th>
            <th>Cap space</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ team, capUsed, capSpace, roster, taxi, ir }) => (
            <tr key={team.slug} className="clickable-row" onClick={() => onSelectTeam(team.slug)}>
              <td>
                <div className="team-cell">
                  <span className="swatch" style={{ background: team.accent }} />
                  <img className="team-cell-logo" src={team.logo} alt="" />
                  {team.name}
                </div>
              </td>
              <td className="num">{roster}</td>
              <td className="num">{taxi}</td>
              <td className="num">{ir}</td>
              <td className="num">{money(capUsed)}</td>
              <td className={`num ${capSpace < 0 ? 'over' : ''}`}>{money(capSpace)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="footnote">
        Taxi squad and IR contracts don't count against the $200 cap. Real data, imported from the master
        spreadsheet — not sample data.
      </p>
    </>
  );
}

function TeamPage({ teamSlug, year }: { teamSlug: string; year: number }) {
  const team = teamBySlug(teamSlug);
  const teamContracts = useMemo(() => contractsForTeam(realContracts, teamSlug), [teamSlug]);

  const withComputed = useMemo(
    () =>
      teamContracts.map((c: Contract) => ({
        contract: c,
        salary: salaryInYear(c, year),
        yearsLeft: yearsRemaining(c, year),
        penalty: cutPenalty(c, year),
      })),
    [teamContracts, year]
  );

  const active = withComputed.filter((r) => r.salary != null && !isTaxi(r.contract, year) && !isIR(r.contract, year));
  const taxi = withComputed.filter((r) => r.salary != null && isTaxi(r.contract, year));
  const ir = withComputed.filter((r) => r.salary != null && isIR(r.contract, year));

  const capUsed = teamCapUsed(teamContracts, year);
  const capSpace = teamCapSpace(teamContracts, year);

  const rowTable = (rows: typeof active, opts?: { badge?: 'taxi' | 'ir' }) => (
    <table>
      <thead>
        <tr>
          <th>Player</th>
          <th>Pos</th>
          <th>Contract</th>
          <th>Salary in {year}</th>
          <th>Years left</th>
          <th>Cut penalty if cut now</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ contract, salary, yearsLeft, penalty }) => {
          const signed = startYear(contract);
          const resignYear = endYear(contract) + 1;
          const resignCost = projectedResignCost(contract);
          return (
            <tr key={contract.id}>
              <td>
                {contract.playerName}
                {opts?.badge === 'taxi' && <span className="badge taxi">Taxi</span>}
                {opts?.badge === 'ir' && <span className="badge ir">IR</span>}
              </td>
              <td>{contract.position || '—'}</td>
              <td>
                <div className="contract-cell">
                  <span className="contract-signed">Signed {signed}</span>
                  <span className="contract-resign">
                    Resign: {money(resignCost)} ({resignYear})
                  </span>
                </div>
              </td>
              <td className="num">{money(salary)}</td>
              <td className="num">{yearsLeft}</td>
              <td className="num">{money(penalty)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <>
      <header className="page-header">
        <div className="team-identity">
          <img className="team-logo" src={team.logo} alt={`${team.name} logo`} />
          <h1>{team.name}</h1>
        </div>
        <div className="hero-slot">
          <span>Stadium + jersey art — coming soon</span>
        </div>
        <div className="color-legend">
          <span className="legend-title">Team colors</span>
          <div className="swatch-row">
            <div className="swatch-item">
              <span className="swatch-block" style={{ background: team.accent }} />
              <span className="swatch-name">Primary</span>
              <span className="swatch-hex">{team.accent}</span>
            </div>
            <div className="swatch-item">
              <span className="swatch-block" style={{ background: team.accent2 }} />
              <span className="swatch-name">Secondary</span>
              <span className="swatch-hex">{team.accent2}</span>
            </div>
            <div className="swatch-item">
              <span className="swatch-block" style={{ background: team.bg }} />
              <span className="swatch-name">Base</span>
              <span className="swatch-hex">{team.bg}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="cap-summary">
        <div className="cap-block">
          <span className="cap-label">Cap used</span>
          <span className="cap-value">{money(capUsed)}</span>
        </div>
        <div className="cap-bar">
          <div
            className={`cap-fill ${capSpace < 0 ? 'over' : ''}`}
            style={{ width: `${Math.min(100, (capUsed / SALARY_CAP) * 100)}%` }}
          />
        </div>
        <div className="cap-block">
          <span className="cap-label">Cap space</span>
          <span className={`cap-value ${capSpace < 0 ? 'over' : ''}`}>{money(capSpace)}</span>
        </div>
      </div>

      {POSITIONS.map((pos) => {
        const rows = active.filter((r) => r.contract.position === pos);
        if (rows.length === 0) return null;
        return (
          <section className="roster-section" key={pos}>
            <h2 className="section-title">{pos}</h2>
            {rowTable(rows)}
          </section>
        );
      })}

      {taxi.length > 0 && (
        <section className="roster-section">
          <h2 className="section-title">Taxi squad</h2>
          <p className="section-note">Does not count against the cap.</p>
          {rowTable(taxi, { badge: 'taxi' })}
        </section>
      )}

      {ir.length > 0 && (
        <section className="roster-section">
          <h2 className="section-title">Injured reserve</h2>
          <p className="section-note">Does not count against the cap.</p>
          {rowTable(ir, { badge: 'ir' })}
        </section>
      )}

      <p className="footnote">
        "Resign" projects the final contracted rate forward using the confirmed escalation increment for as
        many years as the player has been at that rate — e.g. a $10 deal held flat for 4 years projects to
        $10 + ($3 × 4) = $22. This is a consistent anchor, not a market-value forecast — real re-sign price is
        market value at the time, which isn't in this dataset. Cut penalty: 50% of each remaining year's
        salary, rounded up.
      </p>
    </>
  );
}
