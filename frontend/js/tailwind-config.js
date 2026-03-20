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
                },
                type: {
                    grass: '#5FB35F',
                    fire: '#F58C24',
                    water: '#3D7DED',
                    electric: '#FACC1F',
                    psychic: '#D13D87',
                    ice: '#70C2D1',
                    dragon: '#6B3DD1',
                    dark: '#545454',
                    fairy: '#D97395',
                    normal: '#A89E8A',
                    fighting: '#B23631',
                    flying: '#8E7ED9',
                    poison: '#8A47B8',
                    ground: '#BF9440',
                    rock: '#9B844B',
                    bug: '#89AC24',
                    ghost: '#5E4B89',
                    steel: '#98A4B2'
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