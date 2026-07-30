"use client";

import BrokerListPage from "../BrokerListPage";

export default function ApprovedBrokersPage() {
  return (
    <BrokerListPage
      title="Approved Brokers"
      status="approved"
      emptyText="No approved brokers yet."
    />
  );
}
