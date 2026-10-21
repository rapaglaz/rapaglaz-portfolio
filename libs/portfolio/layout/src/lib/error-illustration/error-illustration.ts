import { Component, input } from '@angular/core';

export type ErrorKind = 'notFound' | 'failed';

// A small bot for the error pages. The heading and the message carry the meaning, so the drawing
// is decoration and stays hidden from assistive technology.
@Component({
  selector: 'app-error-illustration',
  template: `
    <svg
      class="illustration"
      viewBox="0 0 240 200"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
      data-testid="error-illustration">
      @if (kind() === 'failed') {
        <g data-testid="error-illustration-failed">
          <rect
            class="socket"
            x="6"
            y="166"
            width="12"
            height="24"
            rx="3" />
          <path
            class="line"
            d="M96 160 C66 160 64 178 40 178" />
          <rect
            class="plug"
            x="28"
            y="170"
            width="14"
            height="16"
            rx="3" />
        </g>
      } @else {
        <g data-testid="error-illustration-not-found">
          <path
            class="line"
            d="M172 56 c0 -11 18 -11 18 0 c0 8 -9 8 -9 17" />
          <circle
            class="dot"
            cx="181"
            cy="82"
            r="2.5" />
        </g>
      }

      <line
        class="line"
        x1="120"
        y1="50"
        x2="120"
        y2="66" />
      <circle
        class="antenna-ball"
        cx="120"
        cy="43"
        r="7" />
      <rect
        class="head"
        x="70"
        y="66"
        width="100"
        height="74"
        rx="22" />
      <rect
        class="screen"
        x="82"
        y="78"
        width="76"
        height="48"
        rx="14" />

      @if (kind() === 'failed') {
        <path
          class="line"
          d="M97 91 l10 10 m0 -10 l-10 10" />
        <path
          class="line"
          d="M133 91 l10 10 m0 -10 l-10 10" />
        <path
          class="line"
          d="M106 118 q14 -9 28 0" />
      } @else {
        <circle
          class="eye"
          cx="102"
          cy="96"
          r="9" />
        <circle
          class="dot"
          cx="104"
          cy="96"
          r="4.5" />
        <circle
          class="eye"
          cx="138"
          cy="96"
          r="9" />
        <circle
          class="dot"
          cx="140"
          cy="96"
          r="4.5" />
        <path
          class="line"
          d="M108 114 h24" />
      }

      <rect
        class="body"
        x="88"
        y="144"
        width="64"
        height="36"
        rx="12" />
    </svg>
  `,
  styleUrl: './error-illustration.css',
})
export class ErrorIllustration {
  readonly kind = input.required<ErrorKind>();
}
