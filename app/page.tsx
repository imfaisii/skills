import { getMarketplace, REPO } from "@/lib/marketplace";

export default async function Home() {
  const marketplace = await getMarketplace();
  const addCommand = `/plugin marketplace add ${REPO}`;

  return (
    <div className="min-h-full bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-100">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-16 px-6 py-20 sm:py-28">
        {/* Hero */}
        <header className="flex flex-col gap-5">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Claude Code marketplace
          </span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {marketplace.name}
          </h1>
          <p className="max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            {marketplace.description} Add the marketplace once, then install any
            skill below straight into Claude Code.
          </p>
        </header>

        {/* Install */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            1. Add the marketplace
          </h2>
          <CommandBlock command={addCommand} />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Run it inside Claude Code. Then install a skill with the command on
            its card.
          </p>
        </section>

        {/* Skills */}
        <section className="flex flex-col gap-5">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            2. Install a skill ({marketplace.plugins.length})
          </h2>
          <ul className="flex flex-col gap-4">
            {marketplace.plugins.map((plugin) => (
              <li
                key={plugin.name}
                className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold tracking-tight">
                      {plugin.displayName ?? plugin.name}
                    </h3>
                    {plugin.category && (
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {plugin.category}
                      </span>
                    )}
                    {plugin.version && (
                      <span className="font-mono text-xs text-zinc-400">
                        v{plugin.version}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {plugin.description}
                  </p>
                </div>
                <CommandBlock
                  command={`/plugin install ${plugin.name}@${marketplace.name}`}
                />
              </li>
            ))}
          </ul>
        </section>

        {/* Footer */}
        <footer className="flex flex-col gap-2 border-t border-zinc-200 pt-8 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <p>
            Maintained by{" "}
            <a
              href={marketplace.owner.url ?? `https://github.com/${REPO}`}
              className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
            >
              {marketplace.owner.name}
            </a>
            .
          </p>
          <p>
            Source on{" "}
            <a
              href={`https://github.com/${REPO}`}
              className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
            >
              GitHub
            </a>
            . See the README to add your own skills.
          </p>
        </footer>
      </main>
    </div>
  );
}

function CommandBlock({ command }: { command: string }) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto rounded-xl border border-zinc-200 bg-white px-4 py-3 font-mono text-sm dark:border-zinc-800 dark:bg-zinc-900">
      <span className="select-none text-zinc-400">$</span>
      <code className="whitespace-nowrap text-zinc-800 dark:text-zinc-200">
        {command}
      </code>
    </div>
  );
}
