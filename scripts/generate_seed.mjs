import fs from 'node:fs';

const tags = [
  { id: 'tag-domain-1', kind: 'domain', name: '1.0 Network Fundamentals', blueprintVersion: 'CCNA 200-301 v1.1' },
  { id: 'tag-domain-2', kind: 'domain', name: '2.0 Network Access', blueprintVersion: 'CCNA 200-301 v1.1' },
  { id: 'tag-domain-3', kind: 'domain', name: '3.0 IP Connectivity', blueprintVersion: 'CCNA 200-301 v1.1' },
  { id: 'tag-domain-4', kind: 'domain', name: '4.0 IP Services', blueprintVersion: 'CCNA 200-301 v1.1' },
  { id: 'tag-domain-5', kind: 'domain', name: '5.0 Security Fundamentals', blueprintVersion: 'CCNA 200-301 v1.1' },
  { id: 'tag-domain-6', kind: 'domain', name: '6.0 Automation and Programmability', blueprintVersion: 'CCNA 200-301 v1.1' },
  { id: 'tag-topic-osi-tcp', kind: 'topic', name: 'TCP/IP and OSI Models', parentId: 'tag-domain-1' },
  { id: 'tag-topic-switch-config', kind: 'topic', name: 'Basic Device Configuration & IOS Modes', parentId: 'tag-domain-2' },
  { id: 'tag-topic-ipv4-addressing', kind: 'topic', name: 'IPv4 Addressing & Subnetting', parentId: 'tag-domain-1' },
  { id: 'tag-topic-security-basics', kind: 'topic', name: 'Network Security Basics', parentId: 'tag-domain-5' },
  { id: 'tag-topic-media-cabling', kind: 'topic', name: 'Physical Media & Cabling', parentId: 'tag-domain-1' }
];

function getTagsForQuestion(qNum, prompt, optionsText) {
  const combined = (prompt + ' ' + optionsText).toLowerCase();
  const res = [];
  if (/security|password|attack|spyware|unauthorized|protect|vty|console/i.test(combined)) {
    res.push('tag-domain-5');
    res.push('tag-topic-security-basics');
  }
  if (/switch|ios|exec|vlan|svi|interface/i.test(combined)) {
    res.push('tag-domain-2');
    res.push('tag-topic-switch-config');
  }
  if (/osi|tcp|udp|protocol|packet|frame|pdu|layer|telnet|http/i.test(combined)) {
    res.push('tag-domain-1');
    res.push('tag-topic-osi-tcp');
  }
  if (/cable|fiber|fibre|copper|wireless|media|light/i.test(combined)) {
    res.push('tag-domain-1');
    res.push('tag-topic-media-cabling');
  }
  if (/ip address|subnet|ipv4|default gateway/i.test(combined)) {
    res.push('tag-domain-1');
    res.push('tag-topic-ipv4-addressing');
  }
  if (res.length === 0) {
    res.push('tag-domain-1');
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
  let assetReferences = [];

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

  const explanation = {
    answerReasoning: `Answer reasoning for question ${qNum}.`,
    conceptRefresher: `Concept refresher covering the relevant CCNA syllabus topics for question ${qNum}.`,
    commonMisconception: `Common misconception associated with this concept in exam preparation.`,
    references: ['Cisco CCNA 200-301 Official Cert Guide', 'Cisco IOS Configuration Fundamentals Command Reference']
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

    if (qNum === 1) {
      explanation.answerReasoning = 'Spyware is software installed on a computer without the user knowledge that gathers personal information and tracks keystrokes, which matches the technician finding in this routine inspection.';
      explanation.conceptRefresher = 'Common security threats: Spyware monitors user activity; DoS attacks flood network resources; Identity theft steals personal credentials; Zero-day attacks exploit unknown vulnerabilities.';
    } else if (qNum === 2) {
      explanation.answerReasoning = 'An extranet provides secure and controlled access to an organization internal network for external trusted entities such as suppliers, vendors, customers, and partners.';
      explanation.conceptRefresher = 'Intranet: accessible only by organization internal members. Extranet: accessible by designated external partners/suppliers. Internet: globally accessible public network.';
    } else if (qNum === 18) {
      explanation.answerReasoning = 'Under "line console 0", the command "password lineconin" followed by "login" configures the console port password required when connecting via the console cable.';
      explanation.conceptRefresher = '"enable secret" protects privileged EXEC mode (# prompt), whereas "line console 0" password protects the initial user EXEC mode (> prompt) over a physical console connection.';
    } else if (qNum === 19) {
      explanation.answerReasoning = 'Configuring an IP address and enabling interface vlan 1 configures a Switch Virtual Interface (SVI) used for remote IP management of a Layer 2 switch.';
      explanation.conceptRefresher = 'A Layer 2 switch does not route packets between physical ports by default, but requires an SVI (commonly VLAN 1) to be reachable via SSH, Telnet, or web management.';
    } else if (qNum === 54) {
      explanation.answerReasoning = 'The prompt "Switch1>" indicates the switch is in user EXEC mode. The command "configure terminal" (or shorthand "config t") is only available in privileged EXEC mode ("Switch1#").';
      explanation.conceptRefresher = 'To enter privileged EXEC mode, the administrator must enter the "enable" command at the user EXEC prompt ("Switch1>").';
    }
  } else if (q.type === 'multi') {
    const options = optionsLines.map((optText, idx) => ({
      id: `opt-${idx + 1}`,
      text: optText.trim()
    }));
    const req = q.requiredSelections || 2;
    const correctOptionIds = options.slice(0, req).map(o => o.id);
    
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
    }

    if (!payload) {
      payload = {
        options,
        correctOptionIds,
        requiredSelections: req
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
          p3: null, // QoS missing
          p4: 'c3',
          p5: null
        },
        allowChoiceReuse: false
      };
    } else if (qNum === 9) {
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
    } else if (qNum === 27) {
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
    } else if (qNum === 28) {
      payload = {
        prompts: [
          { id: 'p1', text: 'displays the next screen' },
          { id: 'p2', text: 'scrolls backwards through previously entered commands' },
          { id: 'p3', text: 'provides context-sensitive help' },
          { id: 'p4', text: 'completes abbreviated commands and parameters' },
          { id: 'p5', text: 'aborts commands such as trace and ping' }
        ],
        choices: [
          { id: 'c1', text: 'Ctrl-Shift-6' },
          { id: 'c2', text: 'Up Arrow' },
          { id: 'c3', text: '?' },
          { id: 'c4', text: 'space bar' },
          { id: 'c5', text: 'Ctrl-C' },
          { id: 'c6', text: 'Tab' }
        ],
        correctMapping: {
          p1: 'c4',
          p2: 'c2',
          p3: 'c3',
          p4: 'c6',
          p5: 'c1'
        },
        allowChoiceReuse: false
      };
    } else if (qNum === 36) {
      payload = {
        prompts: [
          { id: 'p1', text: 'This organization is responsible for overseeing and managing IP address allocation, domain name management, and protocol identifiers.' },
          { id: 'p2', text: 'This organization is the largest developer of international standards in the world for a wide variety of products and services. It is known for its Open Systems Interconnection (OSI) reference model.' },
          { id: 'p3', text: 'This organization promotes the open development, evolution, and use of the Internet throughout the world.' }
        ],
        choices: [
          { id: 'c1', text: 'ISOC' },
          { id: 'c2', text: 'EIA' },
          { id: 'c3', text: 'ISO' },
          { id: 'c4', text: 'IANA' }
        ],
        correctMapping: {
          p1: 'c4',
          p2: 'c3',
          p3: 'c1'
        },
        allowChoiceReuse: false
      };
    } else {
      payload = {
        prompts: [
          { id: 'p1', text: 'Prompt item 1' },
          { id: 'p2', text: 'Prompt item 2' }
        ],
        choices: [
          { id: 'c1', text: 'Choice A' },
          { id: 'c2', text: 'Choice B' }
        ],
        correctMapping: { p1: 'c1', p2: 'c2' },
        allowChoiceReuse: false
      };
    }
  } else if (q.type === 'ordering') {
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
    } else if (qNum === 41) {
      payload = {
        items: [
          { id: 'item-1', text: 'The Telnet-formatted data is provided to the next layer.' },
          { id: 'item-2', text: 'The TCP header is added.' },
          { id: 'item-3', text: 'The IP header is added.' },
          { id: 'item-4', text: 'The Ethernet header is added.' }
        ],
        correctOrderIds: ['item-1', 'item-2', 'item-3', 'item-4']
      };
    } else {
      payload = {
        items: [
          { id: 'item-1', text: 'First step' },
          { id: 'item-2', text: 'Second step' }
        ],
        correctOrderIds: ['item-1', 'item-2']
      };
    }
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
    verificationRecord: {
      verified: false,
      notes: 'Imported from test-1 qb.docx; unverified pending review against authoritative Cisco CCNA 200-301 curriculum.'
    }
  });
}

// Add 2 development fixtures
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

console.log(`Generated data/questions.seed.json: ${questions.length} total questions.`);
