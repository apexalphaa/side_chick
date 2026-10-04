const modes = [
  ["Copilot", "AI suggests. You send."],
  ["Autonomous Initiation", "AI can find eligible profiles and send only the first message. It stops on reply."],
  ["Delegated Conversation", "Explicit temporary delegation lets AI continue within configured limits."]
];

export default function Home() {
  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 40 }}>
      <p style={{ opacity: .65 }}>Phase 1 Foundation</p>
      <h1 style={{ fontSize: 48, marginBottom: 12 }}>Dating Intelligence</h1>
      <p style={{ fontSize: 20, opacity: .8, maxWidth: 760 }}>
        Find, understand, rank, formulate and initiate — while keeping relationship control with you.
      </p>

      <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", marginTop: 40 }}>
        {modes.map(([title, description]) => (
          <article key={title} style={{ padding: 24, border: "1px solid #292932", borderRadius: 16, background: "#121219" }}>
            <h2>{title}</h2>
            <p style={{ opacity: .75, lineHeight: 1.5 }}>{description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
