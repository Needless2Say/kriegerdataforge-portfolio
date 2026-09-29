"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import BurnAway from "./BurnAway";

/*
	The email address, behind a card that burns away when it is dismissed.

	A plain `mailto:` link hands the address straight to whatever the browser
	thinks the mail client is, which on a desktop with nothing configured does
	nothing at all. The card shows the address, offers to copy it, and keeps the
	`mailto:` for anyone who does want it.

	The card is the element `BurnAway` masks, and the wrapper around it exists so
	the fire canvas has somewhere to live that the mask does not reach.
*/

/** How long the burn runs, in milliseconds. */
const BURN_MS = 1150;

/** How long the plain fade runs when the system asks for less motion. */
const FADE_MS = 180;

interface EmailModalProps {
	email: string;
	/** Classes for the trigger. The children are whatever it should look like. */
	className?: string;
	/** Accessible name for the trigger, when its children are not plain text. */
	triggerLabel?: string;
	children: ReactNode;
}

export default function EmailModal({ email, className, triggerLabel, children }: EmailModalProps) {
	const [reduced, setReduced] = useState(false);
	const [open, setOpen] = useState(false);
	const [closing, setClosing] = useState(false);
	const [copied, setCopied] = useState(false);

	const triggerRef = useRef<HTMLButtonElement>(null);
	const cardRef = useRef<HTMLDivElement>(null);

	/*
		Read when the card opens rather than once on mount. It has to come from a
		click either way, because the portal target does not exist while the page
		is being rendered on the server, and asking at open time also picks up
		someone changing the setting between one visit to the card and the next.
	*/
	function openCard() {
		setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
		setOpen(true);
	}

	const finish = useCallback(() => {
		setOpen(false);
		setClosing(false);
		setCopied(false);
	}, []);

	const startClose = useCallback(() => {
		if (closing) return;
		setClosing(true);
		/*
			Focus goes back to the trigger now rather than at the end. The card is
			about to be marked hidden from assistive technology while it burns, and
			hiding an element that still holds focus strands the focus ring.
		*/
		triggerRef.current?.focus();
		if (reduced) window.setTimeout(finish, FADE_MS);
	}, [closing, reduced, finish]);

	useEffect(() => {
		if (!open) return;

		function onKey(event: KeyboardEvent) {
			if (event.key === "Escape") startClose();
		}

		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open, startClose]);

	// The page behind a modal should not scroll under it.
	useEffect(() => {
		if (!open) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => { document.body.style.overflow = previous; };
	}, [open]);

	useEffect(() => {
		if (open && !closing) cardRef.current?.focus();
	}, [open, closing]);

	function handleCopy() {
		if (!navigator.clipboard) return;
		navigator.clipboard.writeText(email).then(
			() => {
				setCopied(true);
				window.setTimeout(() => setCopied(false), 2000);
			},
			() => { /* clipboard refused, the address is on screen to read anyway */ },
		);
	}

	return (
		<>
			<button
				ref={triggerRef}
				type="button"
				onClick={openCard}
				aria-haspopup="dialog"
				aria-label={triggerLabel}
				className={className}
			>
				{children}
			</button>

			{open && createPortal(
				<div
					className="fixed inset-0 z-[150] flex items-center justify-center px-4"
					onClick={startClose}
				>
					{/*
						The blur is dropped the moment the card starts burning. A full
						viewport backdrop blur has to be recomputed every frame while
						anything moves behind it, and measured here it costs more than
						the fire does, roughly 30ms a frame against 22ms without it. It
						is worth paying while the card is sitting still and worth
						nothing during the one second the fire is the whole point.
					*/}
					<div
						className={`absolute inset-0 bg-black/75 ${closing ? "" : "backdrop-blur-md"}`}
						style={{
							opacity: closing ? 0 : 1,
							transition: `opacity ${closing ? BURN_MS : 0}ms ease-in`,
						}}
					/>

					{/*
						The wrapper is not the masked element. `BurnAway` masks the card
						inside it and paints its fire on a canvas that is a sibling of
						the card, because a canvas inside the card would be cut away by
						the same mask that is eating the card.
					*/}
					<div
						className={`relative w-full max-w-sm ${closing ? "pointer-events-none" : ""}`}
						onClick={(event) => event.stopPropagation()}
					>
						<div
							ref={cardRef}
							role="dialog"
							aria-modal="true"
							aria-label="Email address"
							aria-hidden={closing || undefined}
							tabIndex={-1}
							className={`glass-card relative border-amber-600/25 p-5 sm:p-7 text-center outline-none ${
								closing ? "" : "shadow-[0_0_60px_rgba(245,158,11,0.16)] animate-fade-in-up"
							}`}
							style={
								closing && reduced
									? { opacity: 0, transition: `opacity ${FADE_MS}ms linear` }
									: undefined
							}
						>
							{/* Forge corners */}
							<span className="pointer-events-none absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 rounded-tl-md border-amber-500/70" />
							<span className="pointer-events-none absolute -top-px -right-px w-3 h-3 border-t-2 border-r-2 rounded-tr-md border-amber-500/70" />
							<span className="pointer-events-none absolute -bottom-px -left-px w-3 h-3 border-b-2 border-l-2 rounded-bl-md border-amber-500/70" />
							<span className="pointer-events-none absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2 rounded-br-md border-amber-500/70" />

							<div className="mx-auto mb-4 w-12 h-12 rounded-full bg-amber-950/50 border border-amber-600/30 flex items-center justify-center">
								<svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
									<rect x="2" y="4" width="20" height="16" rx="2" />
									<path d="m2 7 10 7 10-7" />
								</svg>
							</div>

							<p className="text-amber-500/60 font-mono text-[10px] tracking-[0.3em] uppercase mb-2">
								transmission address
							</p>
							<p className="text-white font-mono text-base font-medium mb-5 break-all">
								{email}
							</p>

							<button
								type="button"
								onClick={handleCopy}
								className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-all duration-200 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] mb-3 flex items-center justify-center gap-2"
							>
								{copied ? (
									<>
										<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
											<path d="m5 13 4 4L19 7" />
										</svg>
										Copied
									</>
								) : (
									<>
										<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
											<rect x="9" y="9" width="13" height="13" rx="2" />
											<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
										</svg>
										Copy Email
									</>
								)}
							</button>

							<a
								href={`mailto:${email}`}
								className="block text-slate-500 hover:text-amber-300 font-mono text-xs transition-colors duration-200"
							>
								open in mail app →
							</a>

							<button
								type="button"
								onClick={startClose}
								aria-label="Close"
								className="absolute top-3 right-3 text-slate-600 hover:text-amber-300 transition-colors duration-200"
							>
								<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
									<path d="m18 6-12 12M6 6l12 12" />
								</svg>
							</button>
						</div>

						{closing && !reduced && (
							<BurnAway targetRef={cardRef} duration={BURN_MS} onDone={finish} />
						)}
					</div>
				</div>,
				document.body,
			)}
		</>
	);
}
