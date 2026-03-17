tailwind.config = {
    theme: {
        extend: {
            colors: {
                coral: {
                    DEFAULT: 'hsl(0, 100%, 71%)',
                    hover: 'hsl(0, 100%, 65%)',
                },
                cream: 'hsl(40, 33%, 98%)',
            },
            fontFamily: {
                inter: ['Inter', 'sans-serif'],
                quicksand: ['Quicksand', 'sans-serif'],
            },
            borderRadius: {
                '3xl': '2rem',
            }
        }
    }
}