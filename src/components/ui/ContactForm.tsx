"use client";

import { useRef, useState } from "react";
import emailjs from "@emailjs/browser";

type FormStatus = "idle" | "sending" | "success" | "error";

// ─── Fill these in once your KDF business email is ready ─────────────────────
// Copy .env.local.example → .env.local and set the three values.
// ─────────────────────────────────────────────────────────────────────────────
const SERVICE_ID  = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID  ?? "";
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ?? "";
const PUBLIC_KEY  = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY  ?? "";

export default function ContactForm() {
	const formRef = useRef<HTMLFormElement>(null);
	const [status, setStatus] = useState<FormStatus>("idle");
	const [errorMsg, setErrorMsg] = useState("");

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!formRef.current) return;

		if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
			setErrorMsg("Email service not yet configured — please reach out via email directly.");
			setStatus("error");
			return;
		}

		setStatus("sending");
		setErrorMsg("");

		try {
			await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, formRef.current, { publicKey: PUBLIC_KEY });
			setStatus("success");
			formRef.current.reset();
		} catch (err) {
			setErrorMsg("Something went wrong. Please try again or reach out via email.");
			setStatus("error");
			console.error("EmailJS error:", err);
		}
	}

	return (
		<form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
			{/* Name + Email row */}
			<div className="grid sm:grid-cols-2 gap-4">
				<div>
					<label htmlFor="from_name" className="block text-slate-400 font-mono text-xs uppercase tracking-widest mb-1.5">
						Name
					</label>
					<input
						id="from_name"
						name="from_name"
						type="text"
						required
						placeholder="Your name"
						className="w-full bg-white/5 border border-white/8 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600/50 focus:shadow-[0_0_12px_rgba(245,158,11,0.15)] transition-all duration-200"
					/>
				</div>
				<div>
					<label htmlFor="reply_to" className="block text-slate-400 font-mono text-xs uppercase tracking-widest mb-1.5">
						Email
					</label>
					<input
						id="reply_to"
						name="reply_to"
						type="email"
						required
						placeholder="your@email.com"
						className="w-full bg-white/5 border border-white/8 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600/50 focus:shadow-[0_0_12px_rgba(245,158,11,0.15)] transition-all duration-200"
					/>
				</div>
			</div>

			{/* Subject */}
			<div>
				<label htmlFor="subject" className="block text-slate-400 font-mono text-xs uppercase tracking-widest mb-1.5">
					Subject
				</label>
				<input
					id="subject"
					name="subject"
					type="text"
					required
					placeholder="What's this about?"
					className="w-full bg-white/5 border border-white/8 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600/50 focus:shadow-[0_0_12px_rgba(245,158,11,0.15)] transition-all duration-200"
				/>
			</div>

			{/* Message */}
			<div>
				<label htmlFor="message" className="block text-slate-400 font-mono text-xs uppercase tracking-widest mb-1.5">
					Message
				</label>
				<textarea
					id="message"
					name="message"
					required
					rows={5}
					placeholder="Tell us what you're building..."
					className="w-full bg-white/5 border border-white/8 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600/50 focus:shadow-[0_0_12px_rgba(245,158,11,0.15)] transition-all duration-200 resize-none"
				/>
			</div>

			{/* Status messages */}
			{status === "success" && (
				<div className="flex items-center gap-2 text-emerald-400 text-sm font-mono bg-emerald-950/40 border border-emerald-700/30 rounded-lg px-4 py-3">
					<svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
						<path d="m5 13 4 4L19 7" />
					</svg>
					Transmission received — we&apos;ll be in touch.
				</div>
			)}
			{status === "error" && (
				<div className="flex items-center gap-2 text-red-400 text-sm font-mono bg-red-950/40 border border-red-700/30 rounded-lg px-4 py-3">
					<svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" />
					</svg>
					{errorMsg}
				</div>
			)}

			{/* Submit */}
			<button
				type="submit"
				disabled={status === "sending" || status === "success"}
				className="w-full py-3 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-amber-950/50 disabled:text-amber-600 text-white font-semibold text-sm transition-all duration-200 hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2"
			>
				{status === "sending" ? (
					<>
						<svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
							<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
						</svg>
						Forging message...
					</>
				) : status === "success" ? (
					<>
						<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
							<path d="m5 13 4 4L19 7" />
						</svg>
						Sent!
					</>
				) : (
					"Send Message"
				)}
			</button>
		</form>
	);
}
