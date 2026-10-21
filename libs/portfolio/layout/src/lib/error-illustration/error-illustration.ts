import { Component, input } from '@angular/core';

export type ErrorKind = 'notFound' | 'failed';

// Position, tilt, size and line width of the question marks on the not found page. One shape is
// reused, and the strokes do not scale, so the width is the one that is written here.
const QUESTION_MARKS = [
  { transform: 'translate(186 44) scale(1.25)', width: 3 },
  { transform: 'translate(48 70) rotate(-14) scale(0.8)', width: 2 },
  { transform: 'translate(192 88) rotate(12) scale(0.5)', width: 1.5 },
  { transform: 'translate(76 24) rotate(-8) scale(0.6)', width: 2.5 },
  { transform: 'translate(196 118) rotate(-6) scale(0.7)', width: 1.5 },
  { transform: 'translate(46 122) rotate(-12) scale(0.7)', width: 3 },
  { transform: 'translate(130 22) rotate(8) scale(0.85)', width: 2 },
];

// A small bot for the error pages. The heading and the message carry the meaning, so the drawing
// is decoration and stays hidden from assistive technology.
@Component({
  selector: 'app-error-illustration',
  template: `
    <svg
      class="illustration"
      viewBox="20 8 200 138"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
      data-testid="error-illustration">
      @if (kind() === 'failed') {
        <g data-testid="error-illustration-failed">
          <path
            class="line"
            d="M120 66 v-10 l10 -8" />
          <circle
            class="ring"
            cx="134"
            cy="43"
            r="6" />
          <path
            class="line"
            d="M146 34 l4 -4 m2 14 h7 m-9 10 l4 4" />
        </g>
      } @else {
        <g data-testid="error-illustration-not-found">
          @for (mark of questionMarks; track mark.transform) {
            <g [attr.transform]="mark.transform">
              <path
                class="mark"
                d="M0 0 c0 -10 16 -10 16 0 c0 7 -8 7 -8 15"
                [style.stroke-width]="mark.width" />
              <circle
                class="mark-dot"
                cx="8"
                cy="24"
                r="1.8" />
            </g>
          }
        </g>
        <line
          class="line"
          x1="120"
          y1="52"
          x2="120"
          y2="66" />
        <circle
          class="ring"
          cx="120"
          cy="46"
          r="6" />
      }

      <rect
        class="head"
        x="70"
        y="66"
        width="100"
        height="74"
        rx="22" />

      @if (kind() === 'failed') {
        <path
          class="line"
          d="M96 94 l10 10 m0 -10 l-10 10" />
        <path
          class="line"
          d="M134 94 l10 10 m0 -10 l-10 10" />
        <path
          class="line"
          d="M106 124 q14 -9 28 0" />
      } @else {
        <circle
          class="eye"
          cx="101"
          cy="98"
          r="5" />
        <circle
          class="eye"
          cx="139"
          cy="98"
          r="5" />
        <path
          class="line"
          d="M108 118 h24" />
      }
    </svg>
  `,
  styleUrl: './error-illustration.css',
})
export class ErrorIllustration {
  readonly kind = input.required<ErrorKind>();
  protected readonly questionMarks = QUESTION_MARKS;
}
