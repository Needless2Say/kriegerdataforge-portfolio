"use client";

import { useEffect, useState } from "react";

const PHRASES = [
	"Data Engineering Platform",
	"FastAPI + PostgreSQL Backend",
	"Full-Stack App Factory",
	"Forging Data into Products",
	"Built in Chicago, IL",
];

export default function TypewriterText() {
	const [displayed, setDisplayed] = useState("");
	const [phraseIdx, setPhraseIdx]  = useState(0);
	const [charIdx, setCharIdx]       = useState(0);
	const [deleting, setDeleting]     = useState(false);

	useEffect(() => {
		const phrase = PHRASES[phraseIdx];
		const delay  = deleting ? 35 : charIdx === phrase.length ? 1800 : 60;

		const t = setTimeout(() => {
			if (!deleting) {
				if (charIdx < phrase.length) {
					setDisplayed(phrase.slice(0, charIdx + 1));
					setCharIdx(c => c + 1);
				} else {
					setDeleting(true);
				}
			} else {
				if (charIdx > 0) {
					setDisplayed(phrase.slice(0, charIdx - 1));
					setCharIdx(c => c - 1);
				} else {
					setDeleting(false);
					setPhraseIdx(i => (i + 1) % PHRASES.length);
				}
			}
		}, delay);

		return () => clearTimeout(t);
	}, [charIdx, deleting, phraseIdx]);

	return (
		<>
			{displayed}
			<span className="animate-pulse text-amber-400">|</span>
		</>
	);
}
