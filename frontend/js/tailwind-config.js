tailwind.config = {
    darkMode: 'class',
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
                },
                type: {
                    grass: 'hsl(148, 45%, 72%)',
                    fire: 'hsl(25, 95%, 73%)',
                    water: 'hsl(216, 73%, 72%)',
                    electric: 'hsl(45, 95%, 65%)',
                    psychic: 'hsl(330, 65%, 70%)',
                    ice: 'hsl(195, 60%, 75%)',
                    dragon: 'hsl(260, 55%, 60%)',
                    dark: 'hsl(220, 10%, 30%)',
                    fairy: 'hsl(340, 60%, 78%)',
                    normal: 'hsl(30, 15%, 70%)',
                    fighting: 'hsl(15, 70%, 50%)',
                    flying: 'hsl(240, 40%, 75%)',
                    poison: 'hsl(280, 50%, 55%)',
                    ground: 'hsl(35, 50%, 60%)',
                    rock: 'hsl(40, 30%, 50%)',
                    bug: 'hsl(75, 60%, 50%)',
                    ghost: 'hsl(265, 30%, 50%)',
                    steel: 'hsl(210, 10%, 65%)',
                    muted: 'hsl(210, 10%, 80%)'
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