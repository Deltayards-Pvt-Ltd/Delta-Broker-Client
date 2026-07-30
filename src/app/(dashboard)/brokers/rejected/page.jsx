"use client";

import BrokerListPage from "../BrokerListPage";

export default function RejectedBrokersPage() {
  return (
    <BrokerListPage
      title="Rejected Brokers"
      status="rejected"
      emptyText="No rejected brokers."
    />
  );
}
