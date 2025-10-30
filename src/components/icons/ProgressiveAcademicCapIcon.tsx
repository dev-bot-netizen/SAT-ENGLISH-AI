import React from 'react';

interface ProgressiveAcademicCapIconProps extends React.SVGProps<SVGSVGElement> {}

export const ProgressiveAcademicCapIcon: React.FC<ProgressiveAcademicCapIconProps> = (props) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${props.className} academic-cap-animated`}
    >
      <path
        className="academic-cap-mortarboard"
        d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.084a1 1 0 0 0 0 1.838l8.57 3.908a2 2 0 0 0 1.66 0z"
      />
      <path
        className="academic-cap-tassel-string"
        d="M22 10v6"
      />
      <circle
        className="academic-cap-tassel-head"
        cx="22"
        cy="16"
        r="1"
        fill="currentColor"
        strokeWidth="1"
      />
      <path
        className="academic-cap-cap-fill"
        d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"
      />
    </svg>
  );
};
