import styles from "@/app/component/NavigationProgress.module.css";

export default function DashboardLoading() {
  return (
    <div className={styles.fallback} role="status" aria-label="Loading">
      <span className={styles.spinner} />
    </div>
  );
}
