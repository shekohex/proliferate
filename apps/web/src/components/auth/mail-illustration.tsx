export function MailIllustration() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="66" height="66" viewBox="0 0 66 66" fill="none">
			{/* Envelope body */}
			<rect
				x="6"
				y="16"
				width="54"
				height="38"
				rx="5"
				className="fill-muted/30 stroke-border"
				strokeWidth="1.5"
			/>
			{/* Flap */}
			<path
				d="M6 21L33 40L60 21"
				className="stroke-border"
				strokeWidth="1.5"
				strokeLinejoin="round"
			/>
			{/* Bottom fold lines */}
			<path
				d="M6 54L24 38"
				className="stroke-border"
				strokeWidth="1"
				strokeLinecap="round"
				strokeDasharray="3 3"
			/>
			<path
				d="M60 54L42 38"
				className="stroke-border"
				strokeWidth="1"
				strokeLinecap="round"
				strokeDasharray="3 3"
			/>
			{/* Letter peeking out */}
			<rect
				x="16"
				y="8"
				width="34"
				height="28"
				rx="3"
				className="fill-background stroke-border"
				strokeWidth="1.2"
			/>
			<path d="M24 16H42" className="stroke-border" strokeWidth="1.5" strokeLinecap="round" />
			<path d="M24 22H38" className="stroke-border" strokeWidth="1.5" strokeLinecap="round" />
			<path d="M24 28H34" className="stroke-border" strokeWidth="1.5" strokeLinecap="round" />
		</svg>
	);
}

export function CheckBadge() {
	return (
		<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M10 18.333C14.602 18.333 18.333 14.602 18.333 10C18.333 5.398 14.602 1.667 10 1.667C5.398 1.667 1.667 5.398 1.667 10C1.667 14.602 5.398 18.333 10 18.333Z"
				stroke="currentColor"
				strokeWidth="1.5"
			/>
			<path
				d="M7 10L9.5 12.5L13.5 7.5"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
