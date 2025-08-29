<script lang="ts">
	import { Body, Column, Container, Head, Heading, Hr, Html, Section, Text } from 'svelty-email';

	// Accept application data as props
	export let application;
	export let reviewRequest;

	// Font styles
	const fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';

	// Styles
	const mainStyle = {
		backgroundColor: '#ffffff',
		fontFamily
	};

	const containerStyle = {
		margin: '0 auto',
		padding: '20px',
		maxWidth: '600px'
	};

	const headingStyle = {
		fontSize: '22px',
		fontWeight: 'bold',
		marginBottom: '15px',
		color: '#333333'
	};

	const subheadingStyle = {
		fontSize: '18px',
		fontWeight: 'bold',
		marginBottom: '10px',
		color: '#444444'
	};

	const questionStyle = {
		fontSize: '16px',
		fontWeight: 'bold',
		padding: '10px',
		backgroundColor: '#f5f5f5',
		marginBottom: '5px'
	};

	const responseStyle = {
		fontSize: '15px',
		padding: '10px',
		backgroundColor: '#ffffff',
		marginBottom: '15px',
		borderLeft: '3px solid #dddddd'
	};

	const footerStyle = {
		fontSize: '13px',
		color: '#666666',
		marginTop: '30px',
		textAlign: 'center'
	};

	const applicantInfoStyle = {
		backgroundColor: '#f9f9f9',
		padding: '15px',
		borderRadius: '5px',
		marginBottom: '20px'
	};

	const infoLabelStyle = {
		fontWeight: 'bold',
		marginRight: '5px'
	};

	// Table styles
	const tableHeaderStyle = {
		backgroundColor: '#f5f5f5',
		fontWeight: 'bold',
		padding: '10px',
		fontSize: '15px',
		borderBottom: '1px solid #dddddd'
	};

	const tableCellStyle = {
		padding: '10px',
		fontSize: '14px',
		borderBottom: '1px solid #eeeeee'
	};

	const tableWrapperStyle = {
		border: '1px solid #dddddd',
		borderRadius: '4px',
		overflow: 'hidden',
		marginBottom: '20px'
	};

	const tableTotalRowStyle = {
		backgroundColor: '#f9f9f9',
		fontWeight: 'bold'
	};

	const badgeStyle = {
		backgroundColor: '#e9ecef',
		padding: '3px 8px',
		borderRadius: '12px',
		fontSize: '12px',
		fontWeight: 'medium',
		color: '#555555',
		display: 'inline-block'
	};

	const serialId = application?.serial
		? `${application?.expand?.event.responsePrefix}${application.serial.toString().padStart(3, '0')}`
		: application?.id;
</script>

<Html>
	<Head />
	<Body style={mainStyle}>
		<Container style={containerStyle}>
			<Section>
				<Heading style={headingStyle}>Application Review: {serialId}</Heading>
				<Text>This is an exported review of application #{serialId}.</Text>
				<Hr />
			</Section>

			{#if reviewRequest?.shareResponder}
				<Section style={applicantInfoStyle}>
					<Heading as="h2" style={subheadingStyle}>Applicant Information</Heading>
					<Text>
						<Text style={infoLabelStyle}>Name:</Text>
						{application?.expand?.responder?.name}
					</Text>
					<Text>
						<Text style={infoLabelStyle}>Email:</Text>
						{application?.expand?.responder?.email}
					</Text>
				</Section>
			{/if}

			<Section>
				<Heading as="h2" style={subheadingStyle}>Application Responses</Heading>

				{#if application?.expand?.response && application.expand.response.length > 0}
					{#each application.expand.response as response}
						<Section>
							<Text style={questionStyle}>
								{@html response.expand?.question.title}
							</Text>

							{#if response.expand?.question.type === 'member'}
								<Section style={tableWrapperStyle}>
									<!-- Member Table Header -->
									<Section>
										<Column style={tableHeaderStyle}>User</Column>
										<Column style={tableHeaderStyle}>Contact</Column>
										<Column style={tableHeaderStyle}>Status</Column>
										<Column style={tableHeaderStyle}>Tags</Column>
									</Section>

									<!-- Member Table Rows -->
									{#if response.response && Array.isArray(response.response)}
										{#each response.response as member}
											<Section>
												<Column style={tableCellStyle}>
													<Text style={{ margin: '0' }}>
														<Text style={{ fontWeight: 'bold' }}>{member.name}</Text><br />
														<Text style={{ fontSize: '12px', color: '#666' }}
															>{member.username}</Text
														>
													</Text>
												</Column>
												<Column style={tableCellStyle}>
													<Text style={{ margin: '0' }}>
														<Text style={{ fontWeight: 'bold' }}>{member.email}</Text><br />
														<Text style={{ fontSize: '12px', color: '#666' }}>{member.phone}</Text>
													</Text>
												</Column>
												<Column style={tableCellStyle}>
													<Text style={{ margin: '0' }}>{member.college}</Text>
												</Column>
												<Column style={tableCellStyle}>
													<Text style={{ margin: '0' }}>
														<Text style={badgeStyle}>{member.status}</Text>
													</Text>
												</Column>
											</Section>
										{/each}
									{:else}
										<Section>
											<Column style={tableCellStyle}>
												<Text>No member data available</Text>
											</Column>
										</Section>
									{/if}
								</Section>
							{:else if response.expand?.question.type === 'activity'}
								<Section style={tableWrapperStyle}>
									<!-- Activity Table Header -->
									<Section>
										<Column style={tableHeaderStyle}>When</Column>
										<Column style={tableHeaderStyle}>Topic</Column>
										<Column style={tableHeaderStyle}>Venue</Column>
										<Column style={tableHeaderStyle}>Note</Column>
									</Section>

									<!-- Activity Table Rows -->
									{#if response.response && Array.isArray(response.response)}
										{#each response.response as session}
											<Section>
												<Column style={tableCellStyle}>
													<Text style={{ margin: '0' }}>
														<Text style={{ fontWeight: 'bold' }}>
															{new Date(session.date).toLocaleDateString('en-US', {
																year: 'numeric',
																month: 'short',
																day: 'numeric'
															})}
														</Text><br />
														<Text style={{ fontSize: '12px', color: '#666' }}>
															{session.startTime} - {session.endTime}
														</Text>
													</Text>
												</Column>
												<Column style={tableCellStyle}>
													<Text style={{ margin: '0' }}>{session.topic}</Text>
												</Column>
												<Column style={tableCellStyle}>
													<Text style={{ margin: '0' }}>
														<Text style={{ fontWeight: 'bold' }}>{session.form}</Text><br />
														<Text style={{ fontSize: '12px', color: '#666' }}
															>{session.location}</Text
														>
													</Text>
												</Column>
												<Column style={tableCellStyle}>
													<Text style={{ margin: '0' }}>{session.note}</Text>
												</Column>
											</Section>
										{/each}
									{:else}
										<Section>
											<Column style={tableCellStyle}>
												<Text>No activity data available</Text>
											</Column>
										</Section>
									{/if}
								</Section>
							{:else if response.expand?.question.type === 'budget'}
								<Section style={tableWrapperStyle}>
									<!-- Budget Table Header -->
									<Section>
										<Column style={tableHeaderStyle}>Item</Column>
										<Column style={tableHeaderStyle}>Price</Column>
										<Column style={tableHeaderStyle}>Quantity</Column>
										<Column style={tableHeaderStyle}>Total</Column>
									</Section>

									<!-- Budget Table Rows -->
									{#if response.response && Object.keys(response.response).length > 0}
										{#each Object.entries(response.response) as [index, option]}
											<Section>
												<Column style={tableCellStyle}>
													<Text style={{ margin: '0' }}>{option.name}</Text>
												</Column>
												<Column style={tableCellStyle}>
													<Text style={{ margin: '0' }}>{option.defaultPrice}</Text>
												</Column>
												<Column style={tableCellStyle}>
													<Text style={{ margin: '0' }}>{option.defaultQuantity}</Text>
												</Column>
												<Column style={tableCellStyle}>
													<Text style={{ margin: '0' }}>
														{option.calculationMethod === 'default'
															? option.defaultPrice * option.defaultQuantity
															: 'Custom calculation'}
													</Text>
												</Column>
											</Section>
										{/each}

										<!-- Total row -->
										<Section>
											<Column style={{ ...tableCellStyle, ...tableTotalRowStyle }}>
												<Text style={{ margin: '0' }}>Total</Text>
											</Column>
											<Column style={{ ...tableCellStyle, ...tableTotalRowStyle }}>
												<Text style={{ margin: '0' }}></Text>
											</Column>
											<Column style={{ ...tableCellStyle, ...tableTotalRowStyle }}>
												<Text style={{ margin: '0' }}></Text>
											</Column>
											<Column style={{ ...tableCellStyle, ...tableTotalRowStyle }}>
												<Text style={{ margin: '0' }}>
													{Object.values(response.response).reduce((total, item) => {
														if (item.calculationMethod === 'default') {
															return total + item.defaultPrice * item.defaultQuantity;
														}
														return total;
													}, 0)}
												</Text>
											</Column>
										</Section>
									{:else}
										<Section>
											<Column style={tableCellStyle}>
												<Text>No budget data available</Text>
											</Column>
										</Section>
									{/if}
								</Section>
							{:else if response.expand?.question.type === 'file'}
								<Text style={responseStyle}>
									[File Attachment] - Please see online version to access files
								</Text>
							{:else if typeof response.response === 'string'}
								<Text style={responseStyle}>
									{response.response}
								</Text>
							{:else}
								<Text style={responseStyle}>
									[Complex response] - Please see online version for complete details
								</Text>
							{/if}
						</Section>
						<Hr />
					{/each}
				{:else}
					<Text>No responses available for this application.</Text>
				{/if}
			</Section>
		</Container>
	</Body>
</Html>
