"use client";

export default function Community() {
  return (
    <div className="bg-background">
      <section className="container-edit pt-14 md:pt-20 pb-16 grid md:grid-cols-12 gap-12 items-end">
        <div className="md:col-span-7">
          <p className="eyebrow">The community</p>
          <h1 className="font-display text-[clamp(2.5rem,6vw,5.5rem)] leading-[1] mt-4 text-ink">
            We're building this<br /><span className="italic text-primary">pincode by pincode.</span>
          </h1>
          <p className="mt-7 text-lg text-muted-foreground max-w-xl leading-relaxed">
            WearShare is local before it is national. Every neighbourhood gets verified listers, a moderator,
            and a private chat group. Trust scales when people recognise their own.
          </p>
        </div>
        <div className="md:col-span-5 aspect-[5/4] overflow-hidden">
          <img src="/assets/community.jpg" alt="Community" className="h-full w-full object-cover" loading="lazy" />
        </div>
      </section>

      <section className="container-edit py-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
        {[
          ["Indiranagar", "62 listers", "Live"],
          ["Koramangala", "48 listers", "Live"],
          ["HSR Layout", "29 listers", "Live"],
          ["Whitefield", "11 listers", "Beta"],
          ["Jayanagar", "Coming Q2", "Waitlist"],
          ["Mumbai / Bandra", "Coming Q2", "Waitlist"],
          ["Delhi / GK-II", "Coming Q3", "Waitlist"],
          ["Pune / Koregaon Park", "Coming Q3", "Waitlist"],
        ].map(([n, c, s]) => (
          <div key={n} className="bg-background p-6">
            <p className="font-display text-xl text-ink">{n}</p>
            <p className="text-xs text-muted-foreground mt-2">{c}</p>
            <p className={`mt-4 inline-block text-[10px] uppercase tracking-widest px-2 py-1 ${s === "Live" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}>{s}</p>
          </div>
        ))}
      </section>

      <section className="container-edit py-24 md:py-32 grid md:grid-cols-12 gap-12">
        <div className="md:col-span-4">
          <p className="eyebrow">Stories</p>
          <h2 className="font-display text-4xl mt-3 text-ink leading-tight">Honest accounts from listers and renters.</h2>
        </div>
        <div className="md:col-span-8 space-y-10">
          {[
            { q: "I had four sarees from my mother that I wasn't ready to give away. Now they travel to weddings every season - and come back home.", a: "Lakshmi R., 42 / Koramangala" },
            { q: "I'm a college student. I've worn three different lehengas this year. None of them are mine. None of them broke me.", a: "Karan V., 21 / Jayanagar" },
            { q: "I rented a sherwani from a lister 600 metres away. Walked over with chai, walked back with the suit. That was the whole transaction.", a: "Rahul S., 29 / HSR" },
          ].map((s) => (
            <blockquote key={s.a} className="border-l-2 border-primary pl-6">
              <p className="font-display text-2xl md:text-3xl text-ink leading-snug">"{s.q}"</p>
              <footer className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">{s.a}</footer>
            </blockquote>
          ))}
        </div>
      </section>
    </div>
  );
}
