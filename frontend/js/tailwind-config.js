tailwind.config = {
    theme: {
        extend: {
            colors: {
                coral: {
                    DEFAULT: 'hsl(0, 100%, 71%)',
                    hover: 'hsl(0, 100%, 65%)',
                },
                cream: 'hsl(40, 33%, 98%)',
                stat: {
                    green: 'hsl(145, 63%, 42%)',
                    red: 'hsl(0, 84%, 60%)',
                }
            },
            fontFamily: {
                inter: ['Inter', 'sans-serif'],
                quicksand: ['Quicksand', 'sans-serif'],
                display: ['Quicksand', 'sans-serif'],
                body: ['Inter', 'sans-serif'],
            },
            borderRadius: {
                '3xl': '2rem',
            }
        }
    }
}