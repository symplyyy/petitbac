"use client";
import { AvatarConfig, COLORS, EYES, HATS, MOUTHS, randomAvatar } from "@/lib/avatar";
import Avatar from "./Avatar";
import { IRefresh } from "./Icon";

export default function AvatarPicker({
  value,
  onChange,
}: { value: AvatarConfig; onChange: (a: AvatarConfig) => void }) {
  function set<K extends keyof AvatarConfig>(k: K, v: AvatarConfig[K]) {
    onChange({ ...value, [k]: v });
  }

  return (
    <div className="brut p-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 translate-x-1 translate-y-1 bg-stroke rounded-2xl" />
          <div className="relative bg-chalk border-3 border-stroke rounded-2xl p-1">
            <Avatar config={value} size={80} />
          </div>
        </div>
        <div className="flex-1">
          <div className="label-b">Ton avatar</div>
          <div className="font-display font-bold text-lg leading-tight">Customise-le</div>
        </div>
        <button
          type="button"
          className="btn-paper !px-3 !py-2"
          onClick={() => onChange(randomAvatar())}
          aria-label="Aléatoire"
          title="Aléatoire"
        >
          <IRefresh size={18} />
        </button>
      </div>

      <Row label="Couleur">
        {COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-label={c.name}
            onClick={() => set("color", c.hex)}
            className={`w-9 h-9 rounded-full border-3 border-stroke shadow-hardsm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
              value.color === c.hex ? "ring-4 ring-ink/30 ring-offset-2 ring-offset-chalk" : ""
            }`}
            style={{ background: c.hex }}
          />
        ))}
      </Row>

      <Row label="Chapeau">
        {HATS.map((h) => (
          <OptionBtn key={h} active={value.hat === h} onClick={() => set("hat", h)}>
            <Avatar config={{ ...value, hat: h }} size={44} />
          </OptionBtn>
        ))}
      </Row>

      <Row label="Yeux">
        {EYES.map((e) => (
          <OptionBtn key={e} active={value.eyes === e} onClick={() => set("eyes", e)}>
            <Avatar config={{ ...value, eyes: e }} size={44} />
          </OptionBtn>
        ))}
      </Row>

      <Row label="Bouche">
        {MOUTHS.map((m) => (
          <OptionBtn key={m} active={value.mouth === m} onClick={() => set("mouth", m)}>
            <Avatar config={{ ...value, mouth: m }} size={44} />
          </OptionBtn>
        ))}
      </Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <div className="label-b">{label}</div>
      <div className="mt-1.5 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">{children}</div>
    </div>
  );
}

function OptionBtn({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-xl border-3 border-stroke shadow-hardsm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none p-0.5 ${
        active ? "bg-tomato" : "bg-chalk"
      }`}
    >
      {children}
    </button>
  );
}
