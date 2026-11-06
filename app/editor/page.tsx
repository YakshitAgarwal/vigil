import { PageShell } from "@/components/PageShell";
import { loadInbox } from "@/lib/feeds";
import { shortDate } from "@/lib/time";

export const metadata = { title: "Inbox" };
export const revalidate = 300;

export default async function Page() {
  const { items, errors } = await loadInbox();

  return (
    <PageShell>
      <h1 className="pt-14 font-serif text-headline font-medium sm:pt-20">
        Inbox
      </h1>
      <p className="mt-4 max-w-[54ch] text-[17px] leading-relaxed text-smoke">
        Fresh stories from the feeds. Items missing a title, description,
        category, link or date are left out.
      </p>

      {errors.map((e) => (
        <p key={e.feed} role="alert" className="mt-4 text-[14px] text-heat">
          Couldn’t load {e.feed}: {e.error}
        </p>
      ))}

      {items.length === 0 ? (
        <p className="mt-16 max-w-[48ch] text-smoke">
          No stories to show right now.
        </p>
      ) : (
        <div className="mt-14 max-w-[760px]">
          {items.map((item) => (
            <article
              key={item.id}
              className="border-t border-wick/70 py-8 first:border-t-0 first:pt-0"
            >
              <p className="flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-smoke">
                <span>{item.category}</span>
                <time dateTime={new Date(item.publishedAt).toISOString()}>
                  {shortDate(item.publishedAt)}
                </time>
              </p>
              <h2 className="mt-2 max-w-[34ch] font-serif text-[1.5rem] font-medium leading-[1.2] text-balance">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="decoration-flame/70 hover:underline"
                >
                  {item.title}
                </a>
              </h2>
              <p className="mt-3 max-w-[60ch] text-[16px] leading-relaxed text-tallow/90">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
