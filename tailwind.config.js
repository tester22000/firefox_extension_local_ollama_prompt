/** @type {import('tailwindcss').Config} */
module.exports = {
    // 빌드 시 Tailwind CSS 클래스를 스캔할 파일 경로를 지정합니다.
    content: [
        "./*.html", // 프로젝트 루트에 있는 모든 HTML 파일 (popup.html, options.html)
        "./src/js/*.js" // src/js 폴더에 있는 모든 JavaScript 파일
    ],
    theme: {
        extend: {
            // 여기에 사용자 정의 색상, 폰트, 간격 등을 추가합니다.
        },
    },
    plugins: [
        // 여기에 Tailwind CSS 플러그인을 추가합니다.
        // 예: require('@tailwindcss/forms')
    ],
}