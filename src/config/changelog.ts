export interface ChangelogEntry {
    version: string;
    date: string;
    changes: string[];
    type: "major" | "minor" | "patch";
}

export const changelogData: ChangelogEntry[] = [
    {
        version: "0.1.0",
        date: "2025-12-23",
        type: "minor",
        changes: [
            "Sistema de versões e atualizações implementado",
            "Layout full-screen em todas as páginas",
            "Dashboard e Leads redesenhados com UX/UI best practices",
            "Hierarquia visual melhorada com separadores entre seções",
            "Grids otimizados para melhor aproveitamento de espaço",
            "Layout responsivo aprimorado para telas grandes",
        ],
    },
    {
        version: "0.0.0",
        date: "2025-12-23",
        type: "major",
        changes: [
            "Lançamento inicial do sistema",
            "Dashboard de Meta Ads e Google Ads",
            "Gestão de Leads e CRM simples",
            "Sistema de administração de usuários",
            "Layout responsivo e Mobile-First",
        ],
    },
];
