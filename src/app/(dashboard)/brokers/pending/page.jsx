"use client";

import BrokerListPage from "../BrokerListPage";

export default function PendingBrokersPage() {
  return (
    <BrokerListPage
      title="Pending Brokers"
      status="pending"
      emptyText="No pending brokers."
    />
  );
}
