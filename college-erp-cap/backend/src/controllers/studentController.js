const buildProfileData = (authUser = {}) => {
	const email = authUser.email || "24CB023@kpriet.ac.in";
	const rollNoFromEmail = email.split("@")[0]?.toUpperCase() || "24CB023";
	const profileName = authUser.name || "JASWANT KARUN S A";
	const profileUserId = authUser.id || 6119;

	return {
		profile: {
			userId: profileUserId,
			profileId: rollNoFromEmail,
			name: profileName,
			email,
			status: {
				role: authUser.role === "student" ? "Student" : "User",
				activity: "Active",
				userType: "Normal User",
			},
			lastLogin: new Date().toISOString(),
		},
		personalDetails: {
			fullName: profileName,
			dob: "2006-03-25",
			gender: "Male",
			department: "CB",
			dateOfJoining: "2024-08-10",
		},
		contactDetails: {
			studentPhone: "8754159344",
			fatherPhone: "9789699344",
			motherPhone: "9789699342",
		},
		academicDetails: {
			primeStudentId: 17384,
			rollNo: rollNoFromEmail,
			registerNo: "2403711324421012",
			umisNo: "9993445180",
			batch: "II (2024-2028)",
			section: "A",
			labBatch: "1",
			joinYear: 2024,
			nationality: "IND",
		},
		admissionDetails: {
			admissionType: "R",
			quota: "GQ",
			scholarship: "MER",
			cutOff: 182.5,
			aadhaarNo: "333369682763",
			aadhaarName: "S A Jaswant Karun",
			abcId: "535439886186",
		},
		mentorDetails: {
			mentor: {
				name: "SIVASANKARI S",
				code: "CB005",
				phone: "9600046619",
				email: "sivasankari.s@kpriet.ac.in",
			},
			chiefMentor: {
				name: "SIVASANKARI S",
				code: "CB005",
				phone: "9600046619",
				email: "sivasankari.s@kpriet.ac.in",
			},
			sectionHead: {
				name: "SIVASANKARI S",
				code: "CB005",
				phone: "9600046619",
				email: "sivasankari.s@kpriet.ac.in",
			},
		},
		systemDetails: {
			allowedFoodCount: ["Guest", "Director", "Staff", "Student"],
			gatepassBlocked: false,
			freeOuting: 0,
			resetPasswordRequired: true,
			attendanceLimitMinutes: 2880,
		},
		permissions: {
			role: "Normal User",
			groups: ["Students"],
		},
	};
};

const getStudentProfile = (req, res) => {
	const profileData = buildProfileData(req.user || {});
	return res.json(profileData);
};

module.exports = {
	getStudentProfile,
};
