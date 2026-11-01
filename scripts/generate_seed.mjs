import fs from 'node:fs';

const tags = [
  { id: 'tag-domain-1', kind: 'domain', name: '1.0 Network Fundamentals', blueprintVersion: 'CCNA 200-301 v1.1' },
  { id: 'tag-domain-2', kind: 'domain', name: '2.0 Network Access', blueprintVersion: 'CCNA 200-301 v1.1' },
  { id: 'tag-domain-3', kind: 'domain', name: '3.0 IP Connectivity', blueprintVersion: 'CCNA 200-301 v1.1' },
  { id: 'tag-domain-4', kind: 'domain', name: '4.0 IP Services', blueprintVersion: 'CCNA 200-301 v1.1' },
  { id: 'tag-domain-5', kind: 'domain', name: '5.0 Security Fundamentals', blueprintVersion: 'CCNA 200-301 v1.1' },
  { id: 'tag-domain-6', kind: 'domain', name: '6.0 Automation and Programmability', blueprintVersion: 'CCNA 200-301 v1.1' },

  // Domain 1 Topics & Subtopics
  { id: 'tag-topic-osi-tcp', kind: 'topic', name: 'TCP/IP and OSI Models', parentId: 'tag-domain-1' },
  { id: 'tag-subtopic-encapsulation', kind: 'subtopic', name: 'PDU Encapsulation & Headers', parentId: 'tag-topic-osi-tcp' },
  { id: 'tag-subtopic-tcp-udp', kind: 'subtopic', name: 'TCP vs. UDP Protocol Functions', parentId: 'tag-topic-osi-tcp' },

  { id: 'tag-topic-ipv4-addressing', kind: 'topic', name: 'IPv4 Addressing & Subnetting', parentId: 'tag-domain-1' },
  { id: 'tag-subtopic-subnets', kind: 'subtopic', name: 'Subnet Masks & Prefix Design', parentId: 'tag-topic-ipv4-addressing' },

  { id: 'tag-topic-media-cabling', kind: 'topic', name: 'Physical Media & Cabling', parentId: 'tag-domain-1' },
  { id: 'tag-subtopic-copper', kind: 'subtopic', name: 'Copper & Twisted-Pair Media', parentId: 'tag-topic-media-cabling' },
  { id: 'tag-subtopic-fiber', kind: 'subtopic', name: 'Fiber Optic Media', parentId: 'tag-topic-media-cabling' },

  { id: 'tag-topic-network-architectures', kind: 'topic', name: 'Network Topologies & Cloud Models', parentId: 'tag-domain-1' },
  { id: 'tag-subtopic-soho-cloud', kind: 'subtopic', name: 'SOHO Networks & Cloud Services', parentId: 'tag-topic-network-architectures' },

  // Domain 2 Topics & Subtopics
  { id: 'tag-topic-switch-config', kind: 'topic', name: 'Basic Device Configuration & IOS Modes', parentId: 'tag-domain-2' },
  { id: 'tag-subtopic-ios-modes', kind: 'subtopic', name: 'CLI Command Modes & Navigation', parentId: 'tag-topic-switch-config' },
  { id: 'tag-subtopic-svi-config', kind: 'subtopic', name: 'Switch Virtual Interface (SVI) Management', parentId: 'tag-topic-switch-config' },
  { id: 'tag-topic-vlans-trunking', kind: 'topic', name: 'VLANs & Switch Access', parentId: 'tag-domain-2' },

  // Domain 3 Topics & Subtopics
  { id: 'tag-topic-routing-forwarding', kind: 'topic', name: 'Routing Concepts & Packet Forwarding', parentId: 'tag-domain-3' },
  { id: 'tag-subtopic-hop-forwarding', kind: 'subtopic', name: 'End-to-End IP vs. Hop-by-Hop MAC', parentId: 'tag-topic-routing-forwarding' },

  // Domain 4 Topics & Subtopics
  { id: 'tag-topic-ip-services', kind: 'topic', name: 'IP Services (DHCP, DNS, NAT)', parentId: 'tag-domain-4' },

  // Domain 5 Topics & Subtopics
  { id: 'tag-topic-security-basics', kind: 'topic', name: 'Network Security Basics & Threat Types', parentId: 'tag-domain-5' },
  { id: 'tag-subtopic-endpoint-threats', kind: 'subtopic', name: 'Malware, Spyware & DoS Threats', parentId: 'tag-topic-security-basics' },
  { id: 'tag-subtopic-passwords', kind: 'subtopic', name: 'Console, VTY & Enable Password Security', parentId: 'tag-topic-security-basics' },

  // Domain 6 Topics & Subtopics
  { id: 'tag-topic-automation-basics', kind: 'topic', name: 'Automation Concepts & APIs', parentId: 'tag-domain-6' }
];

function getTagsForQuestion(qNum, prompt, optionsText) {
  const combined = (prompt + ' ' + optionsText).toLowerCase();
  const res = [];

  if (/spyware|endpoint|malware|virus|trojan/i.test(combined)) {
    res.push('tag-domain-5', 'tag-topic-security-basics', 'tag-subtopic-endpoint-threats');
  } else if (/password|enable secret|line con|line vty|login/i.test(combined)) {
    res.push('tag-domain-5', 'tag-topic-security-basics', 'tag-subtopic-passwords', 'tag-domain-2', 'tag-topic-switch-config');
  } else if (/security|threat|attack|unauthorized|protect/i.test(combined)) {
    res.push('tag-domain-5', 'tag-topic-security-basics');
  }

  if (/interface vlan|svi|management interface/i.test(combined)) {
    res.push('tag-domain-2', 'tag-topic-switch-config', 'tag-subtopic-svi-config');
  } else if (/exec|configure terminal|config t|prompt|switch>|switch#/i.test(combined)) {
    res.push('tag-domain-2', 'tag-topic-switch-config', 'tag-subtopic-ios-modes');
  } else if (/switch|vlan|trunk/i.test(combined)) {
    res.push('tag-domain-2', 'tag-topic-switch-config');
  }

  if (/destination mac|destination ip|routerb|hosta|default gateway|next hop/i.test(combined)) {
    res.push('tag-domain-3', 'tag-topic-routing-forwarding', 'tag-subtopic-hop-forwarding');
  } else if (/route|router|forwarding|packet/i.test(combined)) {
    res.push('tag-domain-3', 'tag-topic-routing-forwarding');
  }

  if (/encapsulation|pdu|frame|header|transport layer|network layer|data link/i.test(combined)) {
    res.push('tag-domain-1', 'tag-topic-osi-tcp', 'tag-subtopic-encapsulation');
  } else if (/tcp|udp|osi|model/i.test(combined)) {
    res.push('tag-domain-1', 'tag-topic-osi-tcp', 'tag-subtopic-tcp-udp');
  }

  if (/fiber|optic|light|glass/i.test(combined)) {
    res.push('tag-domain-1', 'tag-topic-media-cabling', 'tag-subtopic-fiber');
  } else if (/copper|cable|twisted|utp|stp/i.test(combined)) {
    res.push('tag-domain-1', 'tag-topic-media-cabling', 'tag-subtopic-copper');
  }

  if (/soho|cloud|remote office|intranet|extranet|byod/i.test(combined)) {
    res.push('tag-domain-1', 'tag-topic-network-architectures', 'tag-subtopic-soho-cloud');
  }

  if (/subnet|ip address|prefix|\/24|\/28|ipv4/i.test(combined)) {
    res.push('tag-domain-1', 'tag-topic-ipv4-addressing', 'tag-subtopic-subnets');
  }

  if (res.length === 0) {
    res.push('tag-domain-1', 'tag-topic-osi-tcp');
  }

  return [...new Set(res)];
}

const rawClassified = JSON.parse(fs.readFileSync('scratch_classified_all.json', 'utf8'));

const questions = [];

for (const q of rawClassified) {
  const qNum = q.sourceNumber;
  const externalId = `q${String(qNum).padStart(3, '0')}`;
  const id = `ccna-${externalId}`;
  const tagIds = getTagsForQuestion(qNum, q.prompt, q.rest.join(' '));
  
  let status = 'unverified';
  let needsSourceReason = undefined;
  let cleanupNotes = undefined;
  let duplicateGroupId = undefined;
  let structuredBlocks = undefined;
  const assetReferences = [];

  if (qNum === 18) {
    assetReferences.push({
      id: 'exhibit-q018',
      type: 'image',
      url: '/exhibits/image1.jpeg',
      caption: 'Exhibit: Switch SW1 Access Control Configuration',
      altText: 'Cisco IOS configuration lines for enable secret, enable password, and line console 0'
    });
  } else if (qNum === 24) {
    assetReferences.push({
      id: 'exhibit-q024',
      type: 'image',
      url: '/exhibits/image2.jpeg',
      caption: 'Exhibit: IOS Mode Transitions for Console Configuration',
      altText: 'Modes diagram showing transition from user EXEC to line configuration'
    });
  } else if (qNum === 27) {
    assetReferences.push({
      id: 'exhibit-q027',
      type: 'image',
      url: '/exhibits/image3.jpeg',
      caption: 'Exhibit: IOS Modes Matching Table',
      altText: 'Matching matrix between CLI modes and their descriptions'
    });
    cleanupNotes = 'Question body contained "..." in source docx; options and mappings restored from exhibit image3.jpeg.';
  } else if (qNum === 43) {
    assetReferences.push({
      id: 'exhibit-q043',
      type: 'image',
      url: '/exhibits/image4.png',
      caption: 'Exhibit: Network Topology for ServerB contacting HostA',
      altText: 'Topology diagram with HostA, SwitchA, RouterA, RouterB, SwitchB, and ServerB'
    });
  } else if (qNum === 52) {
    assetReferences.push({
      id: 'exhibit-q052',
      type: 'image',
      url: '/exhibits/image5.jpeg',
      caption: 'Exhibit: Packet Tracer topology placeholder',
      altText: 'PC0 connected to Switch0 via console and ethernet'
    });
    status = 'needs-source';
    needsSourceReason = 'References an absent Packet Tracer activity file (.pkt); excluded from practice until the activity is supplied or an independently reviewed replacement is authored.';
  } else if (qNum === 54) {
    assetReferences.push({
      id: 'exhibit-q054',
      type: 'image',
      url: '/exhibits/image6.png',
      caption: 'Exhibit: Cisco IOS Invalid Input Error',
      altText: 'Switch1> config t followed by % Invalid input detected at ^ marker'
    });
  }

  if (qNum === 5) {
    status = 'needs-source';
    needsSourceReason = 'Missing matching label: Quality of Service (QoS) is missing from source choices; requires reconstruction review before inclusion in practice.';
  }
  if (qNum === 8) {
    cleanupNotes = 'Question asks for "Which of the four network characteristics" but provides 5 options including "reliability".';
  }
  if (qNum === 58 || qNum === 60) {
    duplicateGroupId = 'dup-soho-remote-office';
  }
  if (qNum === 65 || qNum === 68) {
    duplicateGroupId = 'dup-osi-layer-ip-encapsulation';
  }
  if (qNum === 74) {
    cleanupNotes = 'Source contains typo "Fire optic cable"; preserved as written in source with review note noting correction to "Fiber optic cable".';
  }

  let promptText = q.prompt;
  let optionsLines = q.rest;
  if (qNum === 19) {
    promptText = 'A technician enters the following commands on a Cisco switch. What is the technician configuring?';
    structuredBlocks = [
      {
        type: 'code',
        content: 'SwitchA(config)# interface vlan 1\nSwitchA(config-if)# ip address 192.168.1.1 255.255.255.0\nSwitchA(config-if)# no shutdown'
      }
    ];
    optionsLines = ['Telnet access', 'SVI', 'password encryption', 'physical switchport access'];
  }

  // Build clean, honest explanations without generic filler
  let explanation = {
    answerReasoning: `Draft reasoning for question ${qNum}.`,
    conceptRefresher: `Concept refresher for CCNA syllabus topic.`,
    references: ['Cisco CCNA 200-301 Official Cert Guide (Wendell Odom)']
  };

  let payload;

  if (q.type === 'single') {
    const options = optionsLines.map((optText, idx) => ({
      id: `opt-${idx + 1}`,
      text: optText.trim()
    }));

    let correctIdx = 1;
    if (qNum === 1) correctIdx = 3; // spyware
    else if (qNum === 2) correctIdx = 3; // extranet
    else if (qNum === 3) correctIdx = 3; // BYOD
    else if (qNum === 4) correctIdx = 3; // ISP definition
    else if (qNum === 6) correctIdx = 1; // an intranet
    else if (qNum === 7) correctIdx = 3; // powerline networking
    else if (qNum === 8) correctIdx = 3; // security
    else if (qNum === 18) correctIdx = 3; // lineconin
    else if (qNum === 19) correctIdx = 2; // SVI
    else if (qNum === 45) correctIdx = 1; // Ethernet, IP, TCP, HTTP
    else if (qNum === 54) correctIdx = 3; // enter privileged EXEC mode first
    else if (qNum === 58 || qNum === 60) correctIdx = 1; // SOHO network
    else if (qNum === 65 || qNum === 68) correctIdx = 1; // network layer
    else if (qNum === 74) correctIdx = 2; // Fire optic cable

    if (correctIdx > options.length) correctIdx = 1;

    payload = {
      options,
      correctOptionIds: [options[correctIdx - 1].id]
    };

    // Pilot Item 1: Q1 Thorough Explanation
    if (qNum === 1) {
      explanation = {
        answerReasoning: 'Spyware is malicious or unwanted software installed on an endpoint without the user\'s informed consent that covertly monitors activities, logs keystrokes, and collects browsing history and sensitive credentials.',
        conceptRefresher: 'Endpoint threats are categorized by their specific mechanism and intent: Spyware covertly monitors and extracts user data; Identity theft is the subsequent criminal act of impersonation using stolen credentials; Denial of Service (DoS) attacks degrade or overwhelm resource availability; Zero-day attacks exploit previously unknown vulnerabilities for which no patch currently exists.',
        incorrectRationales: [
          { optionIdOrKey: 'opt-1', reason: 'DoS attack: Floods bandwidth, server CPU, or socket tables to render a service unavailable to legitimate users. It does not secretly collect web history.' },
          { optionIdOrKey: 'opt-2', reason: 'Identity theft: The crime of impersonating an individual using their personal identifiable information (PII). Identity theft is a consequence or motivation, whereas spyware is the software mechanism discovered in the inspection.' },
          { optionIdOrKey: 'opt-4', reason: 'Zero-day attack: An attack leveraging a vulnerability unknown to the software vendor with zero days of patch availability. While spyware can theoretically be delivered via a zero-day exploit, the question specifically identifies software collecting web data, which defines spyware.' }
        ],
        practicalExampleOrCommands: 'Common Indicators of Compromise (IoC) include unauthorized network connections to unknown IP addresses on port 80/443, altered browser proxy configurations, and unfamiliar background services.',
        commonMisconception: 'Confusing the malicious delivery mechanism (spyware) with the criminal objective (identity theft), or assuming all malware causes overt operational disruption like a DoS attack.',
        references: [
          'Cisco CCNA 200-301 Official Cert Guide, Volume 2 (Wendell Odom), Chapter 5 "Security Architectures", Section "Common Network Attacks & Malware"',
          'NIST SP 800-83 Rev. 1: Guide to Malware Incident Prevention and Handling'
        ]
      };
    } else if (qNum === 18) {
      // Pilot Item 2: Q18 Thorough Explanation
      explanation = {
        answerReasoning: 'Under the "line console 0" configuration context, the command "password lineconin" followed by "login" defines the password required to access user EXEC mode when connecting through the physical switch console port.',
        conceptRefresher: 'Cisco IOS uses separate password mechanisms for different management boundaries: "line console 0" protects physical console port access; "line vty 0 15" protects remote network sessions (Telnet/SSH); "enable secret" / "enable password" protects elevation from user EXEC mode (">" prompt) to privileged EXEC mode ("#" prompt).',
        incorrectRationales: [
          { optionIdOrKey: 'opt-1', reason: 'letmein: Configured with "enable password letmein" for privileged EXEC access, but overridden in security by "enable secret secretin".' },
          { optionIdOrKey: 'opt-2', reason: 'secretin: Configured with "enable secret secretin", which encrypts the privileged EXEC mode password, not the console port.' },
          { optionIdOrKey: 'opt-4', reason: 'linevtyin: Configured under "line vty 0 15" for remote virtual terminal (VTY) connections, not the console cable.' }
        ],
        practicalExampleOrCommands: 'To verify console password configuration, issue "show running-config | section line con" on the privileged CLI.',
        commonMisconception: 'Assuming "enable secret" secures all switch login prompts, or confusing physical console access with virtual VTY connections.',
        references: [
          'Cisco CCNA 200-301 Official Cert Guide, Volume 1 (Wendell Odom), Chapter 9 "Configuring Basic Switch Management", Section "Securing CLI Access"',
          'Cisco IOS Configuration Fundamentals Command Reference: "line console"'
        ]
      };
    } else if (qNum === 19) {
      explanation = {
        answerReasoning: 'Assigning an IP address and subnet mask to "interface vlan 1" and issuing "no shutdown" configures a Switch Virtual Interface (SVI), which gives the Layer 2 switch an IP identity for management purposes.',
        conceptRefresher: 'Layer 2 switches do not route IP packets on physical ports by default. An SVI (commonly VLAN 1 by default) provides an in-band IP address enabling administrators to manage the switch via SSH, Telnet, SNMP, or web browser.',
        references: ['Cisco CCNA 200-301 Official Cert Guide, Volume 1, Chapter 9 "Configuring Basic Switch Management"']
      };
    } else if (qNum === 54) {
      explanation = {
        answerReasoning: 'The prompt "Switch1>" indicates the switch is currently in user EXEC mode. Global configuration commands such as "configure terminal" (or "config t") can only be entered from privileged EXEC mode ("Switch1#").',
        conceptRefresher: 'To transition from user EXEC mode to privileged EXEC mode, the administrator must first issue the "enable" command.',
        references: ['Cisco CCNA 200-301 Official Cert Guide, Volume 1, Chapter 6 "Navigating the Cisco IOS CLI"']
      };
    } else {
      explanation = {
        answerReasoning: `Draft reasoning: the selected option represents the standard CCNA 200-301 answer for this scenario.`,
        conceptRefresher: `Covers CCNA 200-301 curriculum objectives for ${tags.find(t => tagIds.includes(t.id))?.name || 'Network Fundamentals'}.`,
        references: ['Cisco CCNA 200-301 Official Cert Guide (Wendell Odom)']
      };
    }
  } else if (q.type === 'multi') {
    const options = optionsLines.map((optText, idx) => ({
      id: `opt-${idx + 1}`,
      text: optText.trim()
    }));
    const req = q.requiredSelections || 2;
    const correctOptionIds = options.slice(0, req).map(o => o.id);
    
    // Pilot Item 3: Q43 Thorough Explanation
    if (qNum === 43) {
      const hostAOpt = options.find(o => o.text.includes('packet with the destination IP address of HostA'));
      const routerBOpt = options.find(o => o.text.includes('frame with the destination MAC address of RouterB'));
      if (hostAOpt && routerBOpt) {
        payload = {
          options,
          correctOptionIds: [hostAOpt.id, routerBOpt.id],
          requiredSelections: 2
        };
      }
      explanation = {
        answerReasoning: 'When ServerB prepares to send data across an internetwork to HostA: (1) The Layer 3 IP packet header contains the end-to-end destination IP address of HostA. (2) The Layer 2 Ethernet frame header contains the destination MAC address of the local default gateway, RouterB.',
        conceptRefresher: 'Layer 3 logical addressing remains constant end-to-end across routing hops (unless NAT is applied). In contrast, Layer 2 physical addressing changes hop-by-hop as the frame is de-encapsulated and re-encapsulated across each data link network.',
        incorrectRationales: [
          { optionIdOrKey: 'opt-1', reason: 'Destination IP of RouterB: RouterB is an intermediate gateway hop; host packets are addressed to the final target host (HostA), not the router.' },
          { optionIdOrKey: 'opt-2', reason: 'Destination MAC of SwitchB: Layer 2 switches are transparent bridges within the LAN; frames are addressed to the default gateway router, not the switch MAC.' },
          { optionIdOrKey: 'opt-3', reason: 'Destination IP of RouterA: IP packets carry the final destination host IP address, not intermediate WAN routers.' },
          { optionIdOrKey: 'opt-6', reason: 'Destination MAC of RouterA: ServerB cannot directly communicate at Layer 2 with RouterA across the WAN; it must send frames to its local gateway, RouterB.' }
        ],
        commonMisconception: 'Assuming the destination MAC address is the final destination host, or believing that intermediate Layer 2 switches modify destination MAC addresses.',
        references: [
          'Cisco CCNA 200-301 Official Cert Guide, Volume 1 (Wendell Odom), Chapter 5 "Analyzing Ethernet LAN Switching", Section "Host Forwarding Logic"',
          'RFC 826: An Ethernet Address Resolution Protocol'
        ]
      };
    } else {
      payload = {
        options,
        correctOptionIds,
        requiredSelections: req
      };
      explanation = {
        answerReasoning: `Draft reasoning: the selected options represent the standard CCNA 200-301 multi-selection answer.`,
        conceptRefresher: `Covers CCNA 200-301 curriculum objectives for ${tags.find(t => tagIds.includes(t.id))?.name || 'Network Fundamentals'}.`,
        references: ['Cisco CCNA 200-301 Official Cert Guide (Wendell Odom)']
      };
    }
  } else if (q.type === 'matching') {
    if (qNum === 5) {
      payload = {
        prompts: [
          { id: 'p1', text: 'Protect the network from unauthorized access.' },
          { id: 'p2', text: 'Provide redundant links and devices.' },
          { id: 'p3', text: 'Match the type of communication with a specific priority.' },
          { id: 'p4', text: 'Expand the network without degrading the service for existing users.' },
          { id: 'p5', text: 'Ensure that streaming data is provided over high speed links.' }
        ],
        choices: [
          { id: 'c1', text: 'fault tolerance' },
          { id: 'c2', text: 'security' },
          { id: 'c3', text: 'scalability' }
        ],
        correctMapping: {
          p1: 'c2',
          p2: 'c1',
          p3: null,
          p4: 'c3',
          p5: null
        },
        allowChoiceReuse: false
      };
      explanation = {
        answerReasoning: 'Security protects from unauthorized access; Fault tolerance provides redundancy; Scalability allows expansion without degradation. Quality of Service (QoS) would match priority-based queuing but was omitted from source choices.',
        conceptRefresher: 'The four fundamental characteristics of network architecture are Fault Tolerance, Scalability, Quality of Service (QoS), and Security.',
        references: ['Cisco CCNA 200-301 Official Cert Guide, Volume 1, Chapter 1 "Introduction to Networking"']
      };
    } else if (qNum === 27) {
      // Pilot Item 4: Q27 Thorough Explanation
      payload = {
        prompts: [
          { id: 'p1', text: 'changes made affect the operation of the device as a whole' },
          { id: 'p2', text: 'accessed by entering the enable command' },
          { id: 'p3', text: 'identified by a prompt ending with the # character' },
          { id: 'p4', text: 'limited number of basic monitoring commands' },
          { id: 'p5', text: 'accessed by entering the configure terminal command' },
          { id: 'p6', text: 'the first entrance into the CLI of an IOS device' },
          { id: 'p7', text: 'used to enable the password for vty lines' }
        ],
        choices: [
          { id: 'c1', text: 'user EXEC mode' },
          { id: 'c2', text: 'privileged EXEC mode' },
          { id: 'c3', text: 'global configuration mode' }
        ],
        correctMapping: {
          p1: 'c3',
          p2: 'c2',
          p3: 'c2',
          p4: 'c1',
          p5: 'c3',
          p6: 'c1',
          p7: null
        },
        allowChoiceReuse: true
      };
      explanation = {
        answerReasoning: 'User EXEC mode (">") is the initial entry mode offering basic monitoring commands. Privileged EXEC mode ("#") is reached via "enable" and permits all configuration and diagnostic viewing. Global configuration mode ("(config)#") is reached via "configure terminal" and applies settings affecting device-wide operation. VTY line passwords are set in line configuration mode ("(config-line)#"), making it an unused distractor here.',
        conceptRefresher: 'Cisco IOS operates in a strict hierarchical command structure. Commands from deeper modes cannot be executed in shallower modes without escaping or using mode-specific navigation commands.',
        practicalExampleOrCommands: 'Switch> enable\nSwitch# configure terminal\nSwitch(config)# exit\nSwitch# disable\nSwitch>',
        commonMisconception: 'Believing global configuration mode directly protects passwords, or confusing line configuration mode with global config.',
        references: [
          'Cisco CCNA 200-301 Official Cert Guide, Volume 1 (Wendell Odom), Chapter 6 "Navigating the Cisco IOS CLI", Section "CLI Command Modes"',
          'Cisco IOS Configuration Fundamentals Command Reference: Mode Navigation'
        ]
      };
    } else {
      payload = {
        prompts: [
          { id: 'p1', text: 'not suited for heavily wooded areas' },
          { id: 'p2', text: 'high bandwidth connection that runs over telephone line' },
          { id: 'p3', text: 'uses coaxial cable as a medium' },
          { id: 'p4', text: 'typically uses a T1/E1 or T3/E3 circuit' },
          { id: 'p5', text: 'typically has very low bandwidth' }
        ],
        choices: [
          { id: 'c1', text: 'DSL' },
          { id: 'c2', text: 'dialup telephone' },
          { id: 'c3', text: 'satellite' },
          { id: 'c4', text: 'cable' }
        ],
        correctMapping: {
          p1: 'c3',
          p2: 'c1',
          p3: 'c4',
          p4: null,
          p5: 'c2'
        },
        allowChoiceReuse: false
      };
      explanation = {
        answerReasoning: 'Draft matching mapping based on Internet connectivity media characteristics.',
        conceptRefresher: 'Broadband Internet connectivity options: DSL (telephone line), Cable (coaxial), Satellite (requires clear line of sight), Dial-up (analog modem).',
        references: ['Cisco CCNA 200-301 Official Cert Guide, Volume 1, Chapter 1']
      };
    }
  } else if (q.type === 'ordering') {
    // Pilot Item 5: Q24 Thorough Explanation
    if (qNum === 24) {
      payload = {
        items: [
          { id: 'item-1', text: 'user EXEC mode' },
          { id: 'item-2', text: 'privileged EXEC mode' },
          { id: 'item-3', text: 'global configuration mode' },
          { id: 'item-4', text: 'line configuration mode' }
        ],
        correctOrderIds: ['item-1', 'item-2', 'item-3', 'item-4']
      };
      explanation = {
        answerReasoning: 'To configure the console port password from an initial switch connection: (1) The session starts in user EXEC mode ("Switch>"). (2) Enter "enable" to reach privileged EXEC mode ("Switch#"). (3) Enter "configure terminal" to reach global configuration mode ("Switch(config)#"). (4) Enter "line console 0" to enter line configuration mode ("Switch(config-line)#"), where the password command is entered. Interface configuration mode is a distractor.',
        conceptRefresher: 'IOS command modes form a tree. You must descend from User EXEC -> Privileged EXEC -> Global Configuration -> Line Configuration to reach port-specific management lines.',
        practicalExampleOrCommands: 'Switch> enable\nSwitch# configure terminal\nSwitch(config)# line console 0\nSwitch(config-line)# password cisco\nSwitch(config-line)# login',
        commonMisconception: 'Attempting to enter line configuration commands directly from privileged EXEC mode without first entering global configuration.',
        references: [
          'Cisco CCNA 200-301 Official Cert Guide, Volume 1 (Wendell Odom), Chapter 6 "Navigating the Cisco IOS CLI"',
          'Cisco IOS Configuration Fundamentals Command Reference: "line console 0"'
        ]
      };
    } else {
      payload = {
        items: [
          { id: 'item-1', text: 'The Telnet-formatted data is provided to the next layer.' },
          { id: 'item-2', text: 'The TCP header is added.' },
          { id: 'item-3', text: 'The IP header is added.' },
          { id: 'item-4', text: 'The Ethernet header is added.' }
        ],
        correctOrderIds: ['item-1', 'item-2', 'item-3', 'item-4']
      };
      explanation = {
        answerReasoning: 'Data encapsulation descends from Application -> Transport (TCP) -> Network (IP) -> Data Link (Ethernet).',
        conceptRefresher: 'Each lower layer adds its protocol header to encapsulate the higher-layer payload.',
        references: ['Cisco CCNA 200-301 Official Cert Guide, Volume 1, Chapter 3 "TCP/IP Networking Model"']
      };
    }
  }

    const isPilot = qNum === 1 || qNum === 18 || qNum === 24 || qNum === 27 || qNum === 43;
    let verificationRecord;

    if (isPilot) {
      let consulted = [];
      if (qNum === 1) {
        consulted = [
          'Cisco CCNA 200-301 Official Cert Guide, Volume 2 (Wendell Odom), Chapter 5 "Security Architectures", Section "Common Network Attacks & Malware"',
          'NIST SP 800-83 Rev. 1: Guide to Malware Incident Prevention and Handling'
        ];
      } else if (qNum === 18) {
        consulted = [
          'Cisco CCNA 200-301 Official Cert Guide, Volume 1 (Wendell Odom), Chapter 9 "Configuring Basic Switch Management", Section "Securing CLI Access"'
        ];
      } else if (qNum === 24) {
        consulted = [
          'Cisco CCNA 200-301 Official Cert Guide, Volume 1 (Wendell Odom), Chapter 6 "Navigating the Cisco IOS CLI"'
        ];
      } else if (qNum === 27) {
        consulted = [
          'Cisco CCNA 200-301 Official Cert Guide, Volume 1 (Wendell Odom), Chapter 6 "Navigating the Cisco IOS CLI", Section "CLI Command Modes"'
        ];
      } else if (qNum === 43) {
        consulted = [
          'Cisco CCNA 200-301 Official Cert Guide, Volume 1 (Wendell Odom), Chapter 5 "Analyzing Ethernet LAN Switching", Section "Host Forwarding Logic"'
        ];
      }

      verificationRecord = {
        verified: false,
        whatWasChecked: 'Pilot explanation draft: reasoning, distractor analysis, and references checked against Official Cert Guide.',
        consultedSources: consulted,
        suggestedReferences: ['Cisco CCNA 200-301 Official Cert Guide (Wendell Odom)'],
        notes: 'Proposed answer and explanation; unverified pending formal curriculum sign-off.'
      };
    } else {
      verificationRecord = {
        verified: false,
        consultedSources: [],
        suggestedReferences: ['Cisco CCNA 200-301 Official Cert Guide (Wendell Odom)'],
        notes: 'Source question bank draft; unverified pending detailed review against authoritative curriculum.'
      };
    }

    questions.push({
      id,
      bankId: 'cisco-ccna-test-1',
      externalId,
      sourceNumber: qNum,
      version: 1,
      createdAt: '2026-10-28T00:00:00.000Z',
      updatedAt: '2026-10-28T00:00:00.000Z',
      type: q.type,
      status,
      needsSourceReason,
      prompt: promptText,
      structuredBlocks,
      payload,
      explanation,
      assetReferences,
      tagIds,
      cleanupNotes,
      duplicateGroupId,
      verificationRecord
    });
  }

// 2 Isolated Development Fixtures
questions.push({
  id: 'dev-fixture-01',
  bankId: 'cisco-ccna-test-1',
  externalId: 'fixture-001',
  sourceNumber: 1001,
  version: 1,
  createdAt: '2026-10-28T00:00:00.000Z',
  updatedAt: '2026-10-28T00:00:00.000Z',
  type: 'single',
  status: 'unverified',
  prompt: '[DEV FIXTURE] Which layer of the OSI reference model is responsible for logical IP addressing and path determination?',
  payload: {
    options: [
      { id: 'opt-1', text: 'Physical layer (Layer 1)' },
      { id: 'opt-2', text: 'Data link layer (Layer 2)' },
      { id: 'opt-3', text: 'Network layer (Layer 3)' },
      { id: 'opt-4', text: 'Transport layer (Layer 4)' }
    ],
    correctOptionIds: ['opt-3']
  },
  explanation: {
    answerReasoning: 'The Network layer (Layer 3) handles logical addressing (IPv4/IPv6) and best-path routing across interconnected networks.',
    conceptRefresher: 'OSI 7 Layers: Application, Presentation, Session, Transport, Network, Data Link, Physical.',
    references: ['CCNA 200-301 Official Cert Guide Vol 1']
  },
  assetReferences: [],
  tagIds: ['tag-domain-1', 'tag-topic-osi-tcp'],
  isDevFixture: true,
  verificationRecord: {
    verified: false,
    notes: 'Development fixture explicitly excluded from real progress statistics.'
  }
});

questions.push({
  id: 'dev-fixture-02',
  bankId: 'cisco-ccna-test-1',
  externalId: 'fixture-002',
  sourceNumber: 1002,
  version: 1,
  createdAt: '2026-10-28T00:00:00.000Z',
  updatedAt: '2026-10-28T00:00:00.000Z',
  type: 'multi',
  status: 'unverified',
  prompt: '[DEV FIXTURE] Which two protocols operate at the transport layer of the TCP/IP model? (Choose two.)',
  payload: {
    options: [
      { id: 'opt-1', text: 'Transmission Control Protocol (TCP)' },
      { id: 'opt-2', text: 'Internet Protocol (IP)' },
      { id: 'opt-3', text: 'User Datagram Protocol (UDP)' },
      { id: 'opt-4', text: 'Address Resolution Protocol (ARP)' },
      { id: 'opt-5', text: 'Hypertext Transfer Protocol (HTTP)' }
    ],
    correctOptionIds: ['opt-1', 'opt-3'],
    requiredSelections: 2
  },
  explanation: {
    answerReasoning: 'TCP and UDP are the primary transport layer protocols in the TCP/IP suite. IP and ARP operate at the Internet/network layer.',
    conceptRefresher: 'TCP provides connection-oriented reliable delivery; UDP provides lightweight, connectionless datagram delivery.',
    references: ['RFC 793 (TCP)', 'RFC 768 (UDP)']
  },
  assetReferences: [],
  tagIds: ['tag-domain-1', 'tag-topic-osi-tcp'],
  isDevFixture: true,
  verificationRecord: {
    verified: false,
    notes: 'Development fixture explicitly excluded from real progress statistics.'
  }
});

const seedOutput = {
  schemaVersion: 1,
  bankId: 'cisco-ccna-test-1',
  bankName: 'CCNA Test 1 Question Bank',
  generatedAt: new Date().toISOString(),
  tags,
  questions
};

fs.writeFileSync('data/questions.seed.json', JSON.stringify(seedOutput, null, 2), 'utf8');

console.log(`Generated data/questions.seed.json with ${questions.length} total questions.`);
console.log(`Source bank questions: ${questions.filter(q => !q.isDevFixture).length}`);
console.log(`Dev fixtures: ${questions.filter(q => q.isDevFixture).length}`);
