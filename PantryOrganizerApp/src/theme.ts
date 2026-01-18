
export const theme = {
    colors: {
        primary: '#6366f1', // Indigo 500
        primaryLight: '#818cf8', // Indigo 400
        primaryDark: '#4338ca', // Indigo 700
        secondary: '#14b8a6', // Teal 500
        accent: '#f43f5e', // Rose 500
        background: '#f8fafc', // Slate 50
        surface: '#ffffff',
        text: '#0f172a', // Slate 900
        textSecondary: '#64748b', // Slate 500
        border: '#e2e8f0', // Slate 200
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
    },
    spacing: {
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
        xxl: 40,
    },
    borderRadius: {
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
        round: 9999,
    },
    typography: {
        header: {
            fontSize: 28,
            fontWeight: '700',
            letterSpacing: -0.5,
        },
        subHeader: {
            fontSize: 20,
            fontWeight: '600',
            letterSpacing: -0.3,
        },
        body: {
            fontSize: 16,
            lineHeight: 24,
        },
        caption: {
            fontSize: 14,
            color: '#64748b',
        },
    },
    shadows: {
        soft: {
            shadowColor: '#6366f1',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 4,
        },
        card: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
        },
        float: {
            shadowColor: '#6366f1',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 20,
            elevation: 8,
        },
    },
};
