import { colors } from "@/lib/theme";

interface HistoryPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function HistoryPagination({
    currentPage,
    totalPages,
    onPageChange,
}: HistoryPaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "1rem",
                marginTop: "1rem",
            }}
        >
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{
                    background: "transparent",
                    border: `1px solid ${colors.borderLight}`,
                    borderRadius: "4px",
                    padding: "0.25rem 0.5rem",
                    cursor: currentPage === 1 ? "default" : "pointer",
                    opacity: currentPage === 1 ? 0.3 : 1,
                    color: colors.textMain,
                    fontSize: "10px",
                }}
            >
                {"<"}
            </button>
            <span
                style={{
                    fontSize: "10px",
                    color: colors.textSecondary,
                }}
            >
                {currentPage} / {totalPages}
            </span>
            <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={{
                    background: "transparent",
                    border: `1px solid ${colors.borderLight}`,
                    borderRadius: "4px",
                    padding: "0.25rem 0.5rem",
                    cursor: currentPage === totalPages ? "default" : "pointer",
                    opacity: currentPage === totalPages ? 0.3 : 1,
                    color: colors.textMain,
                    fontSize: "10px",
                }}
            >
                {">"}
            </button>
        </div>
    );
}
