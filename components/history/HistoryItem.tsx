import Image from "next/image";
import { colors } from "@/lib/theme";
import { HistoryItem as HistoryItemType, formatDate, getInitial, getAvatarColor } from "./historyUtils";

interface HistoryItemProps {
    item: HistoryItemType;
    index: number;
    isFiltered: boolean;
    confirmDelete: number | null;
    onLoad: (channelId: string, timestamp: number) => void;
    onDelete: (channelId: string, timestamp: number) => void;
    onConfirmDelete: (timestamp: number) => void;
    onCancelDelete: () => void;
    lang: {
        latest: string;
        viewReport: string;
        deleteReport: string;
        confirmDelete: string;
        cancelAction: string;
    };
}

export default function HistoryItem({
    item,
    index,
    isFiltered,
    confirmDelete,
    onLoad,
    onDelete,
    onConfirmDelete,
    onCancelDelete,
    lang,
}: HistoryItemProps) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem",
                padding: "0.5rem 0",
                borderBottom: `1px solid ${colors.borderLight}`,
                transition: "all 0.2s",
            }}
        >
            {/* Left Side: Avatar + Channel Name (or just date if filtered) */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    overflow: "hidden",
                    minWidth: 0,
                    flex: "1 1 auto",
                    maxWidth: "320px",
                }}
            >
                {!isFiltered && (
                    <>
                        {item.channelAvatar ? (
                            <Image
                                src={item.channelAvatar}
                                alt={item.brandName}
                                width={22}
                                height={22}
                                style={{
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    flexShrink: 0,
                                }}
                                unoptimized
                            />
                        ) : (
                            <div
                                style={{
                                    width: "22px",
                                    height: "22px",
                                    borderRadius: "50%",
                                    background: getAvatarColor(item.brandName),
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontSize: "9px",
                                    fontWeight: "700",
                                    flexShrink: 0,
                                }}
                            >
                                {getInitial(item.brandName)}
                            </div>
                        )}
                    </>
                )}

                {isFiltered ? (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                        }}
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={index === 0 ? colors.info : colors.textSecondary}
                            strokeWidth="2"
                            style={{ flexShrink: 0 }}
                        >
                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p
                            style={{
                                fontSize: "12px",
                                fontWeight: index === 0 ? "600" : "500",
                                color: index === 0 ? colors.textMain : colors.textSecondary,
                                margin: 0,
                            }}
                        >
                            {formatDate(item.createdAt, item.timestamp)}
                        </p>
                        {index === 0 && (
                            <span
                                style={{
                                    fontSize: "9px",
                                    color: colors.textMuted,
                                }}
                            >
                                {lang.latest}
                            </span>
                        )}
                    </div>
                ) : (
                    <p
                        style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: colors.textMain,
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            minWidth: 0,
                            flex: "1 1 auto",
                        }}
                    >
                        {item.brandName}
                    </p>
                )}
            </div>

            {/* Right Side: Date/Time + Actions */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    flexShrink: 0,
                    minWidth: isFiltered ? "auto" : "160px",
                    justifyContent: "flex-end",
                }}
            >
                {!isFiltered && (
                    <span
                        style={{
                            fontSize: "9px",
                            color: colors.textSecondary,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {formatDate(item.createdAt, item.timestamp)}
                    </span>
                )}

                {/* Actions Group */}
                <div
                    style={{
                        display: "flex",
                        gap: "0.25rem",
                        alignItems: "center",
                    }}
                >
                    {confirmDelete === item.timestamp ? (
                        <>
                            <button
                                onClick={() => onDelete(item.channelId, item.timestamp)}
                                style={{
                                    padding: "0.25rem 0.5rem",
                                    fontSize: "10px",
                                    fontWeight: "600",
                                    background: colors.error,
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                }}
                                title={lang.confirmDelete}
                            >
                                ✓
                            </button>
                            <button
                                onClick={onCancelDelete}
                                style={{
                                    padding: "0.25rem 0.5rem",
                                    fontSize: "10px",
                                    fontWeight: "600",
                                    background: colors.bgHover,
                                    color: colors.textMain,
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                }}
                                title={lang.cancelAction}
                            >
                                ✕
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => onLoad(item.channelId, item.timestamp)}
                                style={{
                                    padding: "0.25rem 0.5rem",
                                    fontSize: "10px",
                                    fontWeight: "600",
                                    background: "transparent",
                                    color: colors.info,
                                    border: `1px solid ${colors.info}`,
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.25rem",
                                }}
                                title={lang.viewReport}
                            >
                                <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => onConfirmDelete(item.timestamp)}
                                style={{
                                    padding: "0.25rem",
                                    fontSize: "10px",
                                    fontWeight: "600",
                                    background: "transparent",
                                    color: "#ef4444",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                                title={lang.deleteReport}
                            >
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
