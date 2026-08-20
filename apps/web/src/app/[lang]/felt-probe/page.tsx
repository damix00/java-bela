const variants = [
    [
        "current 0.014 / 0.02 @ 2px",
        "bg-[repeating-linear-gradient(45deg,rgb(255_255_255_/_0.014)_0_2px,transparent_2px_4px),repeating-linear-gradient(-45deg,rgb(0_0_0_/_0.02)_0_2px,transparent_2px_4px)]",
    ],
    [
        "0.03 / 0.045 @ 2px",
        "bg-[repeating-linear-gradient(45deg,rgb(255_255_255_/_0.03)_0_2px,transparent_2px_4px),repeating-linear-gradient(-45deg,rgb(0_0_0_/_0.045)_0_2px,transparent_2px_4px)]",
    ],
    [
        "0.05 / 0.07 @ 2px",
        "bg-[repeating-linear-gradient(45deg,rgb(255_255_255_/_0.05)_0_2px,transparent_2px_4px),repeating-linear-gradient(-45deg,rgb(0_0_0_/_0.07)_0_2px,transparent_2px_4px)]",
    ],
    [
        "0.05 / 0.07 @ 3px",
        "bg-[repeating-linear-gradient(45deg,rgb(255_255_255_/_0.05)_0_3px,transparent_3px_6px),repeating-linear-gradient(-45deg,rgb(0_0_0_/_0.07)_0_3px,transparent_3px_6px)]",
    ],
];

export default function Page() {
    return (
        <div className="grid grid-cols-2">
            {variants.map(([label, cls]) => (
                <div
                    key={label}
                    data-felt=""
                    className={`bg-baize ${cls} flex h-[50vh] items-end p-8`}
                >
                    <p className="bg-ink px-3 py-1 text-sm text-mint">{label}</p>
                </div>
            ))}
        </div>
    );
}
