import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const seedPath = path.join(projectRoot, 'data', 'questions.seed.json');

if (!fs.existsSync(seedPath)) {
  console.error('Seed file not found at:', seedPath);
  process.exit(1);
}

const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

// 1. Official CCNA Exam v1.1 (200-301) Blueprint Taxonomy
export const officialDomains = [
  { id: 'tag-domain-1', name: '1.0 Network Fundamentals', kind: 'domain', parentId: null, blueprintVersion: 'CCNA 200-301 v1.1' },
  { id: 'tag-domain-2', name: '2.0 Network Access', kind: 'domain', parentId: null, blueprintVersion: 'CCNA 200-301 v1.1' },
  { id: 'tag-domain-3', name: '3.0 IP Connectivity', kind: 'domain', parentId: null, blueprintVersion: 'CCNA 200-301 v1.1' },
  { id: 'tag-domain-4', name: '4.0 IP Services', kind: 'domain', parentId: null, blueprintVersion: 'CCNA 200-301 v1.1' },
  { id: 'tag-domain-5', name: '5.0 Security Fundamentals', kind: 'domain', parentId: null, blueprintVersion: 'CCNA 200-301 v1.1' },
  { id: 'tag-domain-6', name: '6.0 Automation and Programmability', kind: 'domain', parentId: null, blueprintVersion: 'CCNA 200-301 v1.1' },
];

export const officialTopics = [
  // ----------------------------------------------------
  // Domain 1: 1.0 Network Fundamentals (1.1 - 1.13)
  // ----------------------------------------------------
  { id: 'tag-topic-1-1', name: '1.1 Explain the role and function of network components', kind: 'topic', parentId: 'tag-domain-1' },
  { id: 'tag-topic-1-2', name: '1.2 Describe characteristics of network topology architectures', kind: 'topic', parentId: 'tag-domain-1' },
  { id: 'tag-topic-1-3', name: '1.3 Compare physical interface and cabling types', kind: 'topic', parentId: 'tag-domain-1' },
  { id: 'tag-topic-1-4', name: '1.4 Identify interface and cable issues (collisions, errors, mismatch duplex, and/or speed)', kind: 'topic', parentId: 'tag-domain-1' },
  { id: 'tag-topic-1-5', name: '1.5 Compare TCP to UDP', kind: 'topic', parentId: 'tag-domain-1' },
  { id: 'tag-topic-1-6', name: '1.6 Configure and verify IPv4 addressing and subnetting', kind: 'topic', parentId: 'tag-domain-1' },
  { id: 'tag-topic-1-7', name: '1.7 Describe private IPv4 addressing', kind: 'topic', parentId: 'tag-domain-1' },
  { id: 'tag-topic-1-8', name: '1.8 Configure and verify IPv6 addressing and prefix', kind: 'topic', parentId: 'tag-domain-1' },
  { id: 'tag-topic-1-9', name: '1.9 Describe IPv6 address types', kind: 'topic', parentId: 'tag-domain-1' },
  { id: 'tag-topic-1-10', name: '1.10 Verify IP parameters for Client OS (Windows, Mac OS, Linux)', kind: 'topic', parentId: 'tag-domain-1' },
  { id: 'tag-topic-1-11', name: '1.11 Describe wireless principles', kind: 'topic', parentId: 'tag-domain-1' },
  { id: 'tag-topic-1-12', name: '1.12 Explain virtualization fundamentals (server virtualization, containers, and VRFs)', kind: 'topic', parentId: 'tag-domain-1' },
  { id: 'tag-topic-1-13', name: '1.13 Describe switching concepts', kind: 'topic', parentId: 'tag-domain-1' },

  // Subtopics for Domain 1
  { id: 'tag-subtopic-1-1-a', name: '1.1.a Routers', kind: 'subtopic', parentId: 'tag-topic-1-1' },
  { id: 'tag-subtopic-1-1-b', name: '1.1.b Layer 2 and Layer 3 switches', kind: 'subtopic', parentId: 'tag-topic-1-1' },
  { id: 'tag-subtopic-1-1-c', name: '1.1.c Next-generation firewalls and IPS', kind: 'subtopic', parentId: 'tag-topic-1-1' },
  { id: 'tag-subtopic-1-1-d', name: '1.1.d Access points', kind: 'subtopic', parentId: 'tag-topic-1-1' },
  { id: 'tag-subtopic-1-1-e', name: '1.1.e Controllers', kind: 'subtopic', parentId: 'tag-topic-1-1' },
  { id: 'tag-subtopic-1-1-f', name: '1.1.f Endpoints', kind: 'subtopic', parentId: 'tag-topic-1-1' },
  { id: 'tag-subtopic-1-1-g', name: '1.1.g Servers', kind: 'subtopic', parentId: 'tag-topic-1-1' },
  { id: 'tag-subtopic-1-1-h', name: '1.1.h PoE', kind: 'subtopic', parentId: 'tag-topic-1-1' },

  { id: 'tag-subtopic-1-2-a', name: '1.2.a Two-tier', kind: 'subtopic', parentId: 'tag-topic-1-2' },
  { id: 'tag-subtopic-1-2-b', name: '1.2.b Three-tier', kind: 'subtopic', parentId: 'tag-topic-1-2' },
  { id: 'tag-subtopic-1-2-c', name: '1.2.c Spine-leaf', kind: 'subtopic', parentId: 'tag-topic-1-2' },
  { id: 'tag-subtopic-1-2-d', name: '1.2.d WAN', kind: 'subtopic', parentId: 'tag-topic-1-2' },
  { id: 'tag-subtopic-1-2-e', name: '1.2.e Small office/home office (SOHO)', kind: 'subtopic', parentId: 'tag-topic-1-2' },
  { id: 'tag-subtopic-1-2-f', name: '1.2.f On-premises and cloud', kind: 'subtopic', parentId: 'tag-topic-1-2' },

  { id: 'tag-subtopic-1-3-a', name: '1.3.a Single-mode fiber, multimode fiber, copper', kind: 'subtopic', parentId: 'tag-topic-1-3' },
  { id: 'tag-subtopic-1-3-b', name: '1.3.b Connections (Ethernet shared media and point-to-point)', kind: 'subtopic', parentId: 'tag-topic-1-3' },

  { id: 'tag-subtopic-1-9-a', name: '1.9.a Unicast (global, unique local, and link local)', kind: 'subtopic', parentId: 'tag-topic-1-9' },
  { id: 'tag-subtopic-1-9-b', name: '1.9.b Anycast', kind: 'subtopic', parentId: 'tag-topic-1-9' },
  { id: 'tag-subtopic-1-9-c', name: '1.9.c Multicast', kind: 'subtopic', parentId: 'tag-topic-1-9' },
  { id: 'tag-subtopic-1-9-d', name: '1.9.d Modified EUI 64', kind: 'subtopic', parentId: 'tag-topic-1-9' },

  { id: 'tag-subtopic-1-11-a', name: '1.11.a Nonoverlapping Wi-Fi channels', kind: 'subtopic', parentId: 'tag-topic-1-11' },
  { id: 'tag-subtopic-1-11-b', name: '1.11.b SSID', kind: 'subtopic', parentId: 'tag-topic-1-11' },
  { id: 'tag-subtopic-1-11-c', name: '1.11.c RF', kind: 'subtopic', parentId: 'tag-topic-1-11' },
  { id: 'tag-subtopic-1-11-d', name: '1.11.d Encryption', kind: 'subtopic', parentId: 'tag-topic-1-11' },

  { id: 'tag-subtopic-1-13-a', name: '1.13.a MAC learning and aging', kind: 'subtopic', parentId: 'tag-topic-1-13' },
  { id: 'tag-subtopic-1-13-b', name: '1.13.b Frame switching', kind: 'subtopic', parentId: 'tag-topic-1-13' },
  { id: 'tag-subtopic-1-13-c', name: '1.13.c Frame flooding', kind: 'subtopic', parentId: 'tag-topic-1-13' },
  { id: 'tag-subtopic-1-13-d', name: '1.13.d MAC address table', kind: 'subtopic', parentId: 'tag-topic-1-13' },

  // ----------------------------------------------------
  // Domain 2: 2.0 Network Access (2.1 - 2.9)
  // ----------------------------------------------------
  { id: 'tag-topic-2-1', name: '2.1 Configure and verify VLANs (normal range) spanning multiple switches', kind: 'topic', parentId: 'tag-domain-2' },
  { id: 'tag-topic-2-2', name: '2.2 Configure and verify interswitch connectivity', kind: 'topic', parentId: 'tag-domain-2' },
  { id: 'tag-topic-2-3', name: '2.3 Configure and verify Layer 2 discovery protocols (Cisco Discovery Protocol and LLDP)', kind: 'topic', parentId: 'tag-domain-2' },
  { id: 'tag-topic-2-4', name: '2.4 Configure and verify (Layer 2/Layer 3) EtherChannel (LACP)', kind: 'topic', parentId: 'tag-domain-2' },
  { id: 'tag-topic-2-5', name: '2.5 Interpret basic operations of Rapid PVST+ Spanning Tree Protocol', kind: 'topic', parentId: 'tag-domain-2' },
  { id: 'tag-topic-2-6', name: '2.6 Describe Cisco Wireless Architectures and AP modes', kind: 'topic', parentId: 'tag-domain-2' },
  { id: 'tag-topic-2-7', name: '2.7 Describe physical infrastructure connections of WLAN components (AP, WLC, access/trunk ports, and LAG)', kind: 'topic', parentId: 'tag-domain-2' },
  { id: 'tag-topic-2-8', name: '2.8 Describe network device management access (Telnet, SSH, HTTP, HTTPS, console, TACACS+/RADIUS, and cloud managed)', kind: 'topic', parentId: 'tag-domain-2' },
  { id: 'tag-topic-2-9', name: '2.9 Interpret the wireless LAN GUI configuration for client connectivity, such as WLAN creation, security settings, QoS profiles, and advanced settings', kind: 'topic', parentId: 'tag-domain-2' },

  // Subtopics for Domain 2
  { id: 'tag-subtopic-2-1-a', name: '2.1.a Access ports (data and voice)', kind: 'subtopic', parentId: 'tag-topic-2-1' },
  { id: 'tag-subtopic-2-1-b', name: '2.1.b Default VLAN', kind: 'subtopic', parentId: 'tag-topic-2-1' },
  { id: 'tag-subtopic-2-1-c', name: '2.1.c InterVLAN connectivity', kind: 'subtopic', parentId: 'tag-topic-2-1' },

  { id: 'tag-subtopic-2-2-a', name: '2.2.a Trunk ports', kind: 'subtopic', parentId: 'tag-topic-2-2' },
  { id: 'tag-subtopic-2-2-b', name: '2.2.b 802.1Q', kind: 'subtopic', parentId: 'tag-topic-2-2' },
  { id: 'tag-subtopic-2-2-c', name: '2.2.c Native VLAN', kind: 'subtopic', parentId: 'tag-topic-2-2' },

  { id: 'tag-subtopic-2-5-a', name: '2.5.a Root port, root bridge (primary/secondary), and other port names', kind: 'subtopic', parentId: 'tag-topic-2-5' },
  { id: 'tag-subtopic-2-5-b', name: '2.5.b Port states and roles', kind: 'subtopic', parentId: 'tag-topic-2-5' },
  { id: 'tag-subtopic-2-5-c', name: '2.5.c PortFast', kind: 'subtopic', parentId: 'tag-topic-2-5' },
  { id: 'tag-subtopic-2-5-d', name: '2.5.d Root guard, loop guard, BPDU filter, and BPDU guard', kind: 'subtopic', parentId: 'tag-topic-2-5' },

  // ----------------------------------------------------
  // Domain 3: 3.0 IP Connectivity (3.1 - 3.5)
  // ----------------------------------------------------
  { id: 'tag-topic-3-1', name: '3.1 Interpret the components of routing table', kind: 'topic', parentId: 'tag-domain-3' },
  { id: 'tag-topic-3-2', name: '3.2 Determine how a router makes a forwarding decision by default', kind: 'topic', parentId: 'tag-domain-3' },
  { id: 'tag-topic-3-3', name: '3.3 Configure and verify IPv4 and IPv6 static routing', kind: 'topic', parentId: 'tag-domain-3' },
  { id: 'tag-topic-3-4', name: '3.4 Configure and verify single area OSPFv2', kind: 'topic', parentId: 'tag-domain-3' },
  { id: 'tag-topic-3-5', name: '3.5 Describe the purpose, functions, and concepts of first hop redundancy protocols', kind: 'topic', parentId: 'tag-domain-3' },

  // Subtopics for Domain 3
  { id: 'tag-subtopic-3-1-a', name: '3.1.a Routing protocol code', kind: 'subtopic', parentId: 'tag-topic-3-1' },
  { id: 'tag-subtopic-3-1-b', name: '3.1.b Prefix', kind: 'subtopic', parentId: 'tag-topic-3-1' },
  { id: 'tag-subtopic-3-1-c', name: '3.1.c Network mask', kind: 'subtopic', parentId: 'tag-topic-3-1' },
  { id: 'tag-subtopic-3-1-d', name: '3.1.d Next hop', kind: 'subtopic', parentId: 'tag-topic-3-1' },
  { id: 'tag-subtopic-3-1-e', name: '3.1.e Administrative distance', kind: 'subtopic', parentId: 'tag-topic-3-1' },
  { id: 'tag-subtopic-3-1-f', name: '3.1.f Metric', kind: 'subtopic', parentId: 'tag-topic-3-1' },
  { id: 'tag-subtopic-3-1-g', name: '3.1.g Gateway of last resort', kind: 'subtopic', parentId: 'tag-topic-3-1' },

  { id: 'tag-subtopic-3-2-a', name: '3.2.a Longest prefix match', kind: 'subtopic', parentId: 'tag-topic-3-2' },
  { id: 'tag-subtopic-3-2-b', name: '3.2.b Administrative distance', kind: 'subtopic', parentId: 'tag-topic-3-2' },
  { id: 'tag-subtopic-3-2-c', name: '3.2.c Routing protocol metric', kind: 'subtopic', parentId: 'tag-topic-3-2' },

  { id: 'tag-subtopic-3-3-a', name: '3.3.a Default route', kind: 'subtopic', parentId: 'tag-topic-3-3' },
  { id: 'tag-subtopic-3-3-b', name: '3.3.b Network route', kind: 'subtopic', parentId: 'tag-topic-3-3' },
  { id: 'tag-subtopic-3-3-c', name: '3.3.c Host route', kind: 'subtopic', parentId: 'tag-topic-3-3' },
  { id: 'tag-subtopic-3-3-d', name: '3.3.d Floating static', kind: 'subtopic', parentId: 'tag-topic-3-3' },

  { id: 'tag-subtopic-3-4-a', name: '3.4.a Neighbor adjacencies', kind: 'subtopic', parentId: 'tag-topic-3-4' },
  { id: 'tag-subtopic-3-4-b', name: '3.4.b Point-to-point', kind: 'subtopic', parentId: 'tag-topic-3-4' },
  { id: 'tag-subtopic-3-4-c', name: '3.4.c Broadcast (DR/BDR selection)', kind: 'subtopic', parentId: 'tag-topic-3-4' },
  { id: 'tag-subtopic-3-4-d', name: '3.4.d Router ID', kind: 'subtopic', parentId: 'tag-topic-3-4' },

  // ----------------------------------------------------
  // Domain 4: 4.0 IP Services (4.1 - 4.9)
  // ----------------------------------------------------
  { id: 'tag-topic-4-1', name: '4.1 Configure and verify inside source NAT using static and pools', kind: 'topic', parentId: 'tag-domain-4' },
  { id: 'tag-topic-4-2', name: '4.2 Configure and verify NTP operating in a client and server mode', kind: 'topic', parentId: 'tag-domain-4' },
  { id: 'tag-topic-4-3', name: '4.3 Explain the role of DHCP and DNS within the network', kind: 'topic', parentId: 'tag-domain-4' },
  { id: 'tag-topic-4-4', name: '4.4 Explain the function of SNMP in network operations', kind: 'topic', parentId: 'tag-domain-4' },
  { id: 'tag-topic-4-5', name: '4.5 Describe the use of syslog features, including facilities and severity levels', kind: 'topic', parentId: 'tag-domain-4' },
  { id: 'tag-topic-4-6', name: '4.6 Configure and verify DHCP client and relay', kind: 'topic', parentId: 'tag-domain-4' },
  { id: 'tag-topic-4-7', name: '4.7 Explain the forwarding per-hop behavior (PHB) for QoS such as classification, marking, queuing, congestion, policing, and shaping', kind: 'topic', parentId: 'tag-domain-4' },
  { id: 'tag-topic-4-8', name: '4.8 Configure network devices for remote access using SSH', kind: 'topic', parentId: 'tag-domain-4' },
  { id: 'tag-topic-4-9', name: '4.9 Describe the capabilities and functions of TFTP/FTP in the network', kind: 'topic', parentId: 'tag-domain-4' },

  // ----------------------------------------------------
  // Domain 5: 5.0 Security Fundamentals (5.1 - 5.10)
  // ----------------------------------------------------
  { id: 'tag-topic-5-1', name: '5.1 Define key security concepts (threats, vulnerabilities, exploits, and mitigation techniques)', kind: 'topic', parentId: 'tag-domain-5' },
  { id: 'tag-topic-5-2', name: '5.2 Describe security program elements (user awareness, training, and physical access control)', kind: 'topic', parentId: 'tag-domain-5' },
  { id: 'tag-topic-5-3', name: '5.3 Configure and verify device access control using local passwords', kind: 'topic', parentId: 'tag-domain-5' },
  { id: 'tag-topic-5-4', name: '5.4 Describe security password policy elements, such as management, complexity, and password alternatives (multifactor authentication, certificates, and biometrics)', kind: 'topic', parentId: 'tag-domain-5' },
  { id: 'tag-topic-5-5', name: '5.5 Describe IPsec remote access and site-to-site VPNs', kind: 'topic', parentId: 'tag-domain-5' },
  { id: 'tag-topic-5-6', name: '5.6 Configure and verify access control lists', kind: 'topic', parentId: 'tag-domain-5' },
  { id: 'tag-topic-5-7', name: '5.7 Configure and verify Layer 2 security features (DHCP snooping, dynamic ARP inspection, and port security)', kind: 'topic', parentId: 'tag-domain-5' },
  { id: 'tag-topic-5-8', name: '5.8 Compare authentication, authorization, and accounting concepts', kind: 'topic', parentId: 'tag-domain-5' },
  { id: 'tag-topic-5-9', name: '5.9 Describe wireless security protocols (WPA, WPA2, and WPA3)', kind: 'topic', parentId: 'tag-domain-5' },
  { id: 'tag-topic-5-10', name: '5.10 Configure and verify WLAN within the GUI using WPA2 PSK', kind: 'topic', parentId: 'tag-domain-5' },

  // ----------------------------------------------------
  // Domain 6: 6.0 Automation and Programmability (6.1 - 6.7)
  // ----------------------------------------------------
  { id: 'tag-topic-6-1', name: '6.1 Explain how automation impacts network management', kind: 'topic', parentId: 'tag-domain-6' },
  { id: 'tag-topic-6-2', name: '6.2 Compare traditional networks with controller-based networking', kind: 'topic', parentId: 'tag-domain-6' },
  { id: 'tag-topic-6-3', name: '6.3 Describe controller-based, software defined architecture (overlay, underlay, and fabric)', kind: 'topic', parentId: 'tag-domain-6' },
  { id: 'tag-topic-6-4', name: '6.4 Explain AI (generative and predictive) and machine learning in network operations', kind: 'topic', parentId: 'tag-domain-6' },
  { id: 'tag-topic-6-5', name: '6.5 Describe characteristics of REST-based APIs (authentication types, CRUD, HTTP verbs, and data encoding)', kind: 'topic', parentId: 'tag-domain-6' },
  { id: 'tag-topic-6-6', name: '6.6 Recognize the capabilities of configuration management mechanisms such as Ansible and Terraform', kind: 'topic', parentId: 'tag-domain-6' },
  { id: 'tag-topic-6-7', name: '6.7 Recognize components of JSON-encoded data', kind: 'topic', parentId: 'tag-domain-6' },

  // Subtopics for Domain 6
  { id: 'tag-subtopic-6-3-a', name: '6.3.a Separation of control plane and data plane', kind: 'subtopic', parentId: 'tag-topic-6-3' },
  { id: 'tag-subtopic-6-3-b', name: '6.3.b Northbound and Southbound APIs', kind: 'subtopic', parentId: 'tag-topic-6-3' },
];

export const allOfficialTags = [...officialDomains, ...officialTopics];

// 2. Intelligent Matcher: Maps any question to its matching official CCNA Domain and Topic
export function classifyQuestionToBlueprint(q) {
  const dt = (q.domainTopic || '').trim();
  const prompt = (q.prompt || '').toLowerCase();
  const reasoning = (q.explanation?.answerReasoning || '').toLowerCase();
  const text = (prompt + ' ' + reasoning).toLowerCase();

  // If explicit domainTopic from trial import exists, use it first
  if (dt) {
    const [domainPart, topicPart] = dt.split('/').map(s => s.trim());
    const topLower = (topicPart || '').toLowerCase();

    // --- Domain 1: Network Fundamentals ---
    if (/network fundamentals/i.test(domainPart)) {
      if (/tcp|udp/i.test(topLower)) return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-5' };
      if (/ipv6 addressing|ipv6/i.test(topLower)) return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-9' };
      if (/private/i.test(topLower)) return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-7' };
      if (/ipv4 subnetting|subnet/i.test(topLower)) return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-6' };
      if (/ipv4/i.test(topLower)) return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-6' };
      if (/cabling|fiber/i.test(topLower)) return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-3' };
      if (/soho/i.test(topLower)) return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-2', subtopicId: 'tag-subtopic-1-2-e' };
      if (/wan/i.test(topLower)) return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-2', subtopicId: 'tag-subtopic-1-2-d' };
      if (/data center|spine/i.test(topLower)) return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-2', subtopicId: 'tag-subtopic-1-2-c' };
      if (/campus|topology|cloud/i.test(topLower)) return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-2' };
      if (/switching|mac|flooding|queuing|forwarding/i.test(topLower)) return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-13' };
      if (/virtual/i.test(topLower)) return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-12' };
      if (/wireless|channel|rf/i.test(topLower)) return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-11' };
      if (/interface troubleshooting|collision/i.test(topLower)) return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-4' };
      if (/power over ethernet|poe/i.test(topLower)) return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-1', subtopicId: 'tag-subtopic-1-1-h' };
      if (/server roles|server/i.test(topLower)) return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-1', subtopicId: 'tag-subtopic-1-1-g' };
      if (/device roles/i.test(topLower)) return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-1' };
      if (/planes/i.test(topLower)) return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-1' };
      return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-1' };
    }

    // --- Domain 2: Network Access ---
    if (/network access/i.test(domainPart)) {
      if (/stp portfast|portfast/i.test(topLower)) return { domainId: 'tag-domain-2', topicId: 'tag-topic-2-5', subtopicId: 'tag-subtopic-2-5-c' };
      if (/stp|spanning/i.test(topLower)) return { domainId: 'tag-domain-2', topicId: 'tag-topic-2-5' };
      if (/etherchannel|lag|channel/i.test(topLower)) return { domainId: 'tag-domain-2', topicId: 'tag-topic-2-4' };
      if (/lldp|cdp/i.test(topLower)) return { domainId: 'tag-domain-2', topicId: 'tag-topic-2-3' };
      if (/trunk|802\.1q|dtp|vtp/i.test(topLower)) return { domainId: 'tag-domain-2', topicId: 'tag-topic-2-2' };
      if (/voice vlan|inter-vlan|vlan/i.test(topLower)) return { domainId: 'tag-domain-2', topicId: 'tag-topic-2-1' };
      if (/wlc|ap modes|wireless ap|wireless lan/i.test(topLower)) return { domainId: 'tag-domain-2', topicId: 'tag-topic-2-6' };
      if (/management|admin/i.test(topLower)) return { domainId: 'tag-domain-2', topicId: 'tag-topic-2-8' };
      if (/wireless|rf|qos|aaa/i.test(topLower)) return { domainId: 'tag-domain-2', topicId: 'tag-topic-2-9' };
      if (/mac learning|mac aging/i.test(topLower)) return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-13' };
      return { domainId: 'tag-domain-2', topicId: 'tag-topic-2-1' };
    }

    // --- Domain 3: IP Connectivity ---
    if (/ip connectivity/i.test(domainPart)) {
      if (/hsrp|vrrp|first-hop|redundancy/i.test(topLower)) return { domainId: 'tag-domain-3', topicId: 'tag-topic-3-5' };
      if (/ospf|eigrp/i.test(topLower)) return { domainId: 'tag-domain-3', topicId: 'tag-topic-3-4' };
      if (/static|floating/i.test(topLower)) return { domainId: 'tag-domain-3', topicId: 'tag-topic-3-3' };
      if (/longest prefix/i.test(topLower)) return { domainId: 'tag-domain-3', topicId: 'tag-topic-3-2' };
      if (/routing|route|distance/i.test(topLower)) return { domainId: 'tag-domain-3', topicId: 'tag-topic-3-1' };
      return { domainId: 'tag-domain-3', topicId: 'tag-topic-3-1' };
    }

    // --- Domain 4: IP Services ---
    if (/ip services/i.test(domainPart)) {
      if (/nat|pat/i.test(topLower)) return { domainId: 'tag-domain-4', topicId: 'tag-topic-4-1' };
      if (/ntp|time|clock/i.test(topLower)) return { domainId: 'tag-domain-4', topicId: 'tag-topic-4-2' };
      if (/dhcp relay|dhcp client/i.test(topLower)) return { domainId: 'tag-domain-4', topicId: 'tag-topic-4-6' };
      if (/dhcp|dns/i.test(topLower)) return { domainId: 'tag-domain-4', topicId: 'tag-topic-4-3' };
      if (/snmp/i.test(topLower)) return { domainId: 'tag-domain-4', topicId: 'tag-topic-4-4' };
      if (/syslog/i.test(topLower)) return { domainId: 'tag-domain-4', topicId: 'tag-topic-4-5' };
      if (/qos|shaping|policing|marking/i.test(topLower)) return { domainId: 'tag-domain-4', topicId: 'tag-topic-4-7' };
      if (/tftp|ftp/i.test(topLower)) return { domainId: 'tag-domain-4', topicId: 'tag-topic-4-9' };
      return { domainId: 'tag-domain-4', topicId: 'tag-topic-4-3' };
    }

    // --- Domain 5: Security Fundamentals ---
    if (/security fundamentals/i.test(domainPart)) {
      if (/wpa|wpa2|wpa3/i.test(topLower)) return { domainId: 'tag-domain-5', topicId: 'tag-topic-5-9' };
      if (/aaa|radius|tacacs/i.test(topLower)) return { domainId: 'tag-domain-5', topicId: 'tag-topic-5-8' };
      if (/port security|dai|arp inspection|dhcp snooping/i.test(topLower)) return { domainId: 'tag-domain-5', topicId: 'tag-topic-5-7' };
      if (/acl|access control/i.test(topLower)) return { domainId: 'tag-domain-5', topicId: 'tag-topic-5-6' };
      if (/ipsec|vpn/i.test(topLower)) return { domainId: 'tag-domain-5', topicId: 'tag-topic-5-5' };
      if (/password/i.test(topLower)) return { domainId: 'tag-domain-5', topicId: 'tag-topic-5-4' };
      if (/device access|ssh|telnet/i.test(topLower)) return { domainId: 'tag-domain-5', topicId: 'tag-topic-5-3' };
      if (/awareness|social engineering/i.test(topLower)) return { domainId: 'tag-domain-5', topicId: 'tag-topic-5-2' };
      if (/firewall|threat/i.test(topLower)) return { domainId: 'tag-domain-5', topicId: 'tag-topic-5-1' };
      return { domainId: 'tag-domain-5', topicId: 'tag-topic-5-1' };
    }

    // --- Domain 6: Automation and Programmability ---
    if (/automation and programmability/i.test(domainPart)) {
      if (/controller/i.test(topLower)) return { domainId: 'tag-domain-6', topicId: 'tag-topic-6-2' };
      if (/sdn|planes/i.test(topLower)) return { domainId: 'tag-domain-6', topicId: 'tag-topic-6-3' };
      if (/ai|machine learning/i.test(topLower)) return { domainId: 'tag-domain-6', topicId: 'tag-topic-6-4' };
      if (/rest|api/i.test(topLower)) return { domainId: 'tag-domain-6', topicId: 'tag-topic-6-5' };
      if (/ansible|terraform/i.test(topLower)) return { domainId: 'tag-domain-6', topicId: 'tag-topic-6-6' };
      if (/json/i.test(topLower)) return { domainId: 'tag-domain-6', topicId: 'tag-topic-6-7' };
      return { domainId: 'tag-domain-6', topicId: 'tag-topic-6-1' };
    }
  }

  // --- Content-based classification for null domainTopic questions & ITN questions ---
  // Domain 6
  if (/controller-based|rest-based api|json string|ansible|terraform/i.test(text)) {
    return { domainId: 'tag-domain-6', topicId: 'tag-topic-6-2' };
  }
  // Domain 5
  if (/spyware|malware|virus|phishing|social engineering|unauthorized traffic/i.test(text)) {
    return { domainId: 'tag-domain-5', topicId: 'tag-topic-5-1' };
  }
  if (/tacacs|radius|aaa/i.test(text)) {
    return { domainId: 'tag-domain-5', topicId: 'tag-topic-5-8' };
  }
  if (/dynamic arp inspection|dhcp snooping|sticky mac|port security/i.test(text)) {
    return { domainId: 'tag-domain-5', topicId: 'tag-topic-5-7' };
  }
  if (/password-encryption|enable secret|line vty|line con|console password/i.test(text)) {
    return { domainId: 'tag-domain-5', topicId: 'tag-topic-5-3' };
  }
  if (/ipsec|site-to-site vpn/i.test(text)) {
    return { domainId: 'tag-domain-5', topicId: 'tag-topic-5-5' };
  }
  if (/firewall/i.test(text)) {
    return { domainId: 'tag-domain-5', topicId: 'tag-topic-5-1' };
  }
  // Domain 4
  if (/nat pool|static nat|dynamic nat|pat overload/i.test(text)) {
    return { domainId: 'tag-domain-4', topicId: 'tag-topic-4-1' };
  }
  if (/ntp master|ntp server|clock set/i.test(text)) {
    return { domainId: 'tag-domain-4', topicId: 'tag-topic-4-2' };
  }
  if (/helper-address|dhcp relay|dhcp binding/i.test(text)) {
    return { domainId: 'tag-domain-4', topicId: 'tag-topic-4-6' };
  }
  if (/snmp-server|snmpv3|snmp/i.test(text) && !/osi/i.test(text)) {
    return { domainId: 'tag-domain-4', topicId: 'tag-topic-4-4' };
  }
  if (/syslog|logging trap/i.test(text)) {
    return { domainId: 'tag-domain-4', topicId: 'tag-topic-4-5' };
  }
  if (/traffic shaping|policing/i.test(text)) {
    return { domainId: 'tag-domain-4', topicId: 'tag-topic-4-7' };
  }
  if (/tftp/i.test(text)) {
    return { domainId: 'tag-domain-4', topicId: 'tag-topic-4-9' };
  }
  // Domain 3
  if (/hsrp|vrrp|first hop/i.test(text)) {
    return { domainId: 'tag-domain-3', topicId: 'tag-topic-3-5' };
  }
  if (/ospf|eigrp/i.test(text)) {
    return { domainId: 'tag-domain-3', topicId: 'tag-topic-3-4' };
  }
  if (/static route|floating static|default-route/i.test(text)) {
    return { domainId: 'tag-domain-3', topicId: 'tag-topic-3-3' };
  }
  if (/longest prefix/i.test(text)) {
    return { domainId: 'tag-domain-3', topicId: 'tag-topic-3-2' };
  }
  if (/routing table|administrative distance/i.test(text)) {
    return { domainId: 'tag-domain-3', topicId: 'tag-topic-3-1' };
  }
  // Domain 2
  if (/spanning-tree|stp|portfast|bpdu/i.test(text)) {
    return { domainId: 'tag-domain-2', topicId: 'tag-topic-2-5' };
  }
  if (/etherchannel|lacp|channel-group/i.test(text)) {
    return { domainId: 'tag-domain-2', topicId: 'tag-topic-2-4' };
  }
  if (/lldp|cdp/i.test(text)) {
    return { domainId: 'tag-domain-2', topicId: 'tag-topic-2-3' };
  }
  if (/trunk|802\.1q|native vlan/i.test(text)) {
    return { domainId: 'tag-domain-2', topicId: 'tag-topic-2-2' };
  }
  if (/voice vlan|access vlan|inter-vlan|vlan/i.test(text)) {
    return { domainId: 'tag-domain-2', topicId: 'tag-topic-2-1' };
  }
  if (/wlc|capwap|flexconnect|lightweight ap/i.test(text)) {
    return { domainId: 'tag-domain-2', topicId: 'tag-topic-2-6' };
  }
  // Domain 1
  if (/tcp and udp|three-way handshake|transport layer|syn ack/i.test(text)) {
    return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-5' };
  }
  if (/ipv6|eui-64|slaac|2001:|fe80:|ff00:|fc00:|fd00:/i.test(text)) {
    if (/unicast|multicast|anycast|link-local|unique local|eui-64/i.test(text)) {
      return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-9' };
    }
    return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-8' };
  }
  if (/rfc 1918|private ipv4|private address|without access to the internet|private network/i.test(text)) {
    return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-7' };
  }
  if (/subnet|mask|\/24|\/25|\/26|\/27|\/28|\/29|\/30|prefix length/i.test(text)) {
    return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-6' };
  }
  if (/fiber|copper|1000base|10gbase|sfp|utp|cabling|single-mode|multimode/i.test(text)) {
    return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-3' };
  }
  if (/spine-leaf|two-tier|three-tier|collapsed-core|wan|soho|cloud/i.test(text)) {
    return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-2' };
  }
  if (/mac address|frame flooding|unknown unicast|cam table|aging|store-and-forward|cut-through/i.test(text)) {
    return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-13' };
  }
  if (/wireless|802\.11|2\.4 ghz|5 ghz|channel|band select/i.test(text)) {
    return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-11' };
  }
  if (/virtual machine|hypervisor|virtualization/i.test(text)) {
    return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-12' };
  }
  if (/collision|late collision|runt|crc/i.test(text)) {
    return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-4' };
  }
  if (/router|switch|firewall|endpoint|server|poe/i.test(text)) {
    return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-1' };
  }

  return { domainId: 'tag-domain-1', topicId: 'tag-topic-1-1' };
}

// 3. Map all questions to the official taxonomy
const trialImportPath = path.join(projectRoot, 'ingestion', 'ccna_trial_import_200.json');
const trialImportAdditionalPath = path.join(projectRoot, 'ingestion', 'ccna_trial_import_additional_200.json');
let nullTrialIds = new Set();
if (fs.existsSync(trialImportPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(trialImportPath, 'utf8'));
    pkg.questions.filter(q => !q.domainTopic).forEach(q => nullTrialIds.add(q.id));
  } catch {}
}
if (fs.existsSync(trialImportAdditionalPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(trialImportAdditionalPath, 'utf8'));
    pkg.questions.filter(q => !q.domainTopic).forEach(q => nullTrialIds.add(q.id));
  } catch {}
}

let remappedCount = 0;
let nullDomainCount = 0;
const domainDistribution = {};

seed.questions.forEach((q) => {
  if (q.isDevFixture) return;

  if (nullTrialIds.has(q.id)) {
    q.tagIds = [];
    nullDomainCount++;
    return;
  }

  const classification = classifyQuestionToBlueprint(q);
  const newTagIds = [classification.domainId, classification.topicId];
  if (classification.subtopicId) {
    newTagIds.push(classification.subtopicId);
  }

  q.tagIds = newTagIds;
  remappedCount++;
  domainDistribution[classification.domainId] = (domainDistribution[classification.domainId] || 0) + 1;
});

// Update seed tags with clean official blueprint
seed.tags = allOfficialTags;

// Write back to seed
fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2), 'utf8');

console.log('✓ Successfully applied Official CCNA Exam v1.1 Blueprint taxonomy!');
console.log(`✓ Total taxonomy tags: ${allOfficialTags.length} (${officialDomains.length} domains, 53 topics, ${officialTopics.filter(t => t.kind === 'subtopic').length} subtopics)`);
console.log(`✓ Remapped ${remappedCount} active questions to official blueprint domains and topics:`);
Object.entries(domainDistribution).forEach(([dom, count]) => {
  const domName = officialDomains.find(d => d.id === dom)?.name;
  console.log(`  - ${domName} (${dom}): ${count} questions`);
});
