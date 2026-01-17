"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({ errorInfo });

        // Log error to console in development
        console.error("ErrorBoundary caught an error:", error, errorInfo);

        // TODO: Send to error tracking service (e.g., Sentry)
        // if (typeof window !== 'undefined' && window.Sentry) {
        //     window.Sentry.captureException(error, { extra: errorInfo });
        // }
    }

    handleRetry = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="error-boundary">
                    <div className="error-boundary-content">
                        <h2>Đã xảy ra lỗi</h2>
                        <p>
                            Ứng dụng gặp sự cố không mong muốn. Vui lòng thử
                            lại.
                        </p>

                        {process.env.NODE_ENV === "development" &&
                            this.state.error && (
                                <details className="error-details">
                                    <summary>Chi tiết lỗi (Development)</summary>
                                    <pre>
                                        {this.state.error.toString()}
                                        {this.state.errorInfo?.componentStack}
                                    </pre>
                                </details>
                            )}

                        <div className="error-actions">
                            <button
                                onClick={this.handleRetry}
                                className="btn btn-primary"
                            >
                                Thử lại
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="btn btn-outline"
                            >
                                Tải lại trang
                            </button>
                        </div>
                    </div>

                    <style jsx>{`
                        .error-boundary {
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 400px;
                            padding: 2rem;
                        }

                        .error-boundary-content {
                            text-align: center;
                            max-width: 500px;
                        }

                        .error-boundary-content h2 {
                            color: #dc2626;
                            margin-bottom: 0.5rem;
                        }

                        .error-boundary-content p {
                            color: #6b7280;
                            margin-bottom: 1.5rem;
                        }

                        .error-details {
                            text-align: left;
                            background: #fef2f2;
                            border: 1px solid #fecaca;
                            border-radius: 8px;
                            padding: 1rem;
                            margin-bottom: 1.5rem;
                        }

                        .error-details summary {
                            cursor: pointer;
                            font-weight: 500;
                            color: #991b1b;
                        }

                        .error-details pre {
                            margin-top: 0.5rem;
                            font-size: 0.75rem;
                            overflow-x: auto;
                            white-space: pre-wrap;
                            word-break: break-word;
                        }

                        .error-actions {
                            display: flex;
                            gap: 0.75rem;
                            justify-content: center;
                        }
                    `}</style>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
